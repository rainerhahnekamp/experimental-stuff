import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface ExtractedFunction {
  code: string;
  context: string;
  fileName: string;
  lineNumber: number;
  usedIdentifiers: Set<string>; // Track identifiers used in the function
  parameters?: any[]; // Store parameters if it's a renderComponent function
}

// Ensure the directory exists before writing to a file
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// Function to collect imports from the source file
function collectImports(sourceFile: ts.SourceFile): ts.ImportDeclaration[] {
  const importDeclarations: ts.ImportDeclaration[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      importDeclarations.push(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return importDeclarations;
}

// Function to relativize import paths for local imports only
function relativizeImportPaths(importPath: string, inputDir: string, outputDir: string): string {
  // Keep static imports like @angular/... or absolute paths unchanged
  if (!importPath.startsWith('.')) {
    return importPath;
  }
  const absoluteImportPath = path.resolve(inputDir, importPath);
  const relativeImportPath = path.relative(outputDir, absoluteImportPath);
  return relativeImportPath.startsWith('.') ? relativeImportPath : './' + relativeImportPath;
}

// Function to extract function calls and the identifiers they use
function extractFunctions(
  sourceFile: ts.SourceFile,
  printer: ts.Printer,
  functionNames: string[],
  extractedFunctions: ExtractedFunction[],
  fileName: string
): ts.SourceFile {
  let functionCounter = 1;

  function visit(node: ts.Node): ts.Node {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const functionName = node.expression.text;

      // Only extract renderComponent for the renderComponentFunctionsMap
      if (functionNames.includes(functionName)) {
        const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;

        // Special case for renderComponent
        if (functionName === 'renderComponent') {
          // Collect parameters for renderComponent
          const parameters = node.arguments.map(arg => printer.printNode(ts.EmitHint.Expression, arg, sourceFile));

          // Save the parameters for renderComponent
          extractedFunctions.push({
            code: '', // No need for function code for renderComponent
            context: 'renderComponent',
            fileName: fileName,
            lineNumber: lineNumber,
            usedIdentifiers: new Set(),
            parameters: parameters,
          });

          // Collect identifiers for imports from the parameters
          const usedIdentifiers = new Set<string>();
          node.arguments.forEach(arg => {
            if (ts.isObjectLiteralExpression(arg)) {
              arg.properties.forEach(property => {
                if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
                  if (property.name.text === 'providers' && ts.isArrayLiteralExpression(property.initializer)) {
                    property.initializer.elements.forEach(element => {
                      if (ts.isIdentifier(element)) {
                        usedIdentifiers.add(element.text);
                      }
                    });
                  }
                }
              });
            } else if (ts.isIdentifier(arg)) {
              usedIdentifiers.add(arg.text);
            }
          });
          extractedFunctions[extractedFunctions.length - 1].usedIdentifiers = usedIdentifiers;
        } else if (functionName === 'runInBrowser') {
          // Special case for runInBrowser: Extract only the body of the function
          const functionBody = node.arguments[0]; // Get the function body passed to runInBrowser
          const nodeCode = printer.printNode(ts.EmitHint.Unspecified, functionBody, sourceFile); // Extract only the inner body

          const usedIdentifiers = new Set<string>();
          function collectIdentifiers(n: ts.Node) {
            if (ts.isIdentifier(n)) {
              usedIdentifiers.add(n.text);
            }
            ts.forEachChild(n, collectIdentifiers);
          }
          collectIdentifiers(functionBody);

          extractedFunctions.push({
            code: nodeCode, // Only store the body of runInBrowser
            context: functionName,
            fileName: fileName,
            lineNumber: lineNumber,
            usedIdentifiers: usedIdentifiers,
          });
        }
      }
    }
    // Recursively visit each child node
    return ts.visitEachChild(node, visit, undefined);
  }

  return ts.visitNode(sourceFile, visit) as ts.SourceFile;
}

// Function to extract relevant imports and relativize paths
function extractRelevantImports(
  sourceFile: ts.SourceFile,
  importDeclarations: ts.ImportDeclaration[],
  usedIdentifiers: Set<string>,
  inputDir: string,
  outputDir: string,
  printer: ts.Printer
): string {
  let relevantImports = '';

  for (const importDecl of importDeclarations) {
    const namedBindings = importDecl.importClause?.namedBindings;

    if (namedBindings && ts.isNamedImports(namedBindings)) {
      const relevantElements = namedBindings.elements.filter((element) =>
        usedIdentifiers.has(element.name.text)
      );

      if (relevantElements.length > 0) {
        const updatedImport = ts.factory.updateImportDeclaration(
          importDecl,
          importDecl.modifiers,
          ts.factory.updateImportClause(
            importDecl.importClause,
            importDecl.importClause?.isTypeOnly || false,
            importDecl.importClause?.name,
            ts.factory.createNamedImports(relevantElements)
          ),
          ts.factory.createStringLiteral(
            relativizeImportPaths((importDecl.moduleSpecifier as ts.StringLiteral).text, inputDir, outputDir)
          ), // Relativize only local import paths
          undefined
        );

        relevantImports += printer.printNode(ts.EmitHint.Unspecified, updatedImport, sourceFile) + '\n';
      }
    }
  }

  return relevantImports;
}

// Main function to parse, extract, and save the extracted functions as an object literal
export function extractBrowserFunctions(
  filePath: string,
  outputDir: string,
  functionNames: string[]
) {
  // Get the input file's directory
  const inputDir = path.dirname(filePath);

  // Read the input TypeScript file
  const inputFile = fs.readFileSync(filePath, 'utf8');

  // Parse the file into an AST
  const sourceFile = ts.createSourceFile(filePath, inputFile, ts.ScriptTarget.Latest, true);

  // Create a printer to print the nodes back to string
  const printer = ts.createPrinter();

  // Array to store extracted functions
  const extractedFunctions: ExtractedFunction[] = [];

  // Collect all import declarations
  const importDeclarations = collectImports(sourceFile);

  // Transform the source file, extracting the specified functions
  extractFunctions(sourceFile, printer, functionNames, extractedFunctions, path.basename(filePath));

  // Create a unique filename for the extracted functions
  const uniqueFunctionsFileName = `extractedFunctions_${Date.now()}.ts`; // Unique name with timestamp
  const extractedFunctionsPath = path.join(outputDir, uniqueFunctionsFileName);

  let extractedFunctionsCode = '';
  let renderComponentFunctionsCode = '';
  let combinedUsedIdentifiers = new Set<string>();

  // Create an object literal where keys are line numbers and values are functions
  extractedFunctionsCode += 'export const extractedFunctionsMap = {\n';
  renderComponentFunctionsCode += 'export const renderComponentFunctionsMap = {\n';

  for (const func of extractedFunctions) {
    combinedUsedIdentifiers = new Set([...combinedUsedIdentifiers, ...func.usedIdentifiers]);

    if (func.context !== 'renderComponent') {
      // Include non-renderComponent functions (e.g., runInBrowser) in the extractedFunctionsMap
      extractedFunctionsCode += `  ${func.lineNumber}: function() {\n${func.code}\n},\n\n`;
    } else {
      // Add renderComponent to the renderComponentFunctionsMap
      renderComponentFunctionsCode += `  ${func.lineNumber}: [${func.parameters?.join(', ')}],\n\n`;
      func.parameters?.forEach(param => combinedUsedIdentifiers.add(param));
    }
  }

  extractedFunctionsCode += '};\n\n';
  renderComponentFunctionsCode += '};\n\n';

  // Extract the relevant import statements and relativize import paths
  const relevantImports = extractRelevantImports(sourceFile, importDeclarations, combinedUsedIdentifiers, inputDir, outputDir, printer);

  // Write imports and functions to the extracted file
  const fullExtractedCode = relevantImports + '\n' + extractedFunctionsCode + renderComponentFunctionsCode;
  ensureDirectoryExistence(extractedFunctionsPath);
  fs.writeFileSync(extractedFunctionsPath, fullExtractedCode);
  console.log(`Extracted functions saved to ${extractedFunctionsPath}`);
}

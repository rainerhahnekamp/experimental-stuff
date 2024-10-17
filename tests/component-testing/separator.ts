import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface ExtractedFunction {
  name: string;
  code: string;
  context: string;
}

// Function to traverse and extract runInBrowser calls and context
function extractRunInBrowserCalls(
  sourceFile: ts.SourceFile,
  printer: ts.Printer,
  extractedFunctions: ExtractedFunction[],
  currentContext: string = ''
): ts.SourceFile {
  let functionCounter = 1;

  function visit(node: ts.Node, context: string): ts.Node {
    // Track context based on if statements and function declarations
    if (ts.isIfStatement(node)) {
      context += 'if statement -> ';
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      context += `function ${node.name.text} -> `;
    }

    // Check if the node is a call expression to runInBrowser
    if (ts.isCallExpression(node) && node.expression.getText() === 'runInBrowser') {
      // Generate unique identifier for each runInBrowser call
      const functionName = `runInBrowser_${functionCounter}`;
      functionCounter++;

      // Get the full source of the runInBrowser call
      const nodeCode = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);

      // Save the extracted code and its context
      extractedFunctions.push({
        name: functionName,
        code: nodeCode,
        context
      });

      // Replace runInBrowser call with the function reference
      return ts.factory.createIdentifier(`${functionName}()`);
    }

    // Recursively visit each child node
    return ts.visitEachChild(node, (child) => visit(child, context), undefined);
  }

  const newSourceFile: ts.SourceFile = ts.visitNode(sourceFile, (node) => visit(node, currentContext));
  return newSourceFile;
}

// Function to extract imports related to runInBrowser calls
function extractRunInBrowserImports(
  sourceFile: ts.SourceFile,
  usedIdentifiers: Set<string>,
  printer: ts.Printer
): string {
  let extractedImports = '';

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const namedBindings = node.importClause?.namedBindings;
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        // Collect the import specifiers that are used
        const importSpecifiers = namedBindings.elements.filter((el) =>
          usedIdentifiers.has(el.name.text)
        );
        if (importSpecifiers.length > 0) {
          // Create a new import declaration with only the used specifiers
          const newImport = ts.factory.updateImportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            ts.factory.updateImportClause(
              node.importClause,
              node.importClause?.isTypeOnly || false,
              node.importClause?.name,
              ts.factory.createNamedImports(importSpecifiers)
            ),
            node.moduleSpecifier,
            undefined
          );
          extractedImports += printer.printNode(ts.EmitHint.Unspecified, newImport, sourceFile) + '\n';
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return extractedImports;
}

// Main function to parse and extract code
function parseAndExtract(filePath: string, outputFilePath: string, secondFilePath: string) {
  // Read the input TypeScript file
  const inputFile = fs.readFileSync(filePath, 'utf8');

  // Parse the file into an AST
  const sourceFile = ts.createSourceFile(filePath, inputFile, ts.ScriptTarget.Latest, true);

  // Create a printer to print the nodes back to string
  const printer = ts.createPrinter();

  // Array to store extracted functions
  const extractedFunctions: ExtractedFunction[] = [];

  // Transform the source file, extracting `runInBrowser` calls
  const newSourceFile = extractRunInBrowserCalls(sourceFile, printer, extractedFunctions);

  // Print the updated source file (with runInBrowser calls replaced)
  const newSourceCode = printer.printFile(newSourceFile);

  // Save the updated source code back to the input file
  fs.writeFileSync(outputFilePath, newSourceCode);
  console.log(`Updated code saved to ${outputFilePath}`);

  // Create and save the extracted functions to the second file
  let extractedFunctionsCode = '';
  for (const func of extractedFunctions) {
    extractedFunctionsCode += `// Extracted from ${func.context}\n`;
    extractedFunctionsCode += `function ${func.name}() ${func.code}\n\n`;
  }
  fs.writeFileSync(secondFilePath, extractedFunctionsCode);
  console.log(`Extracted functions saved to ${secondFilePath}`);
}

// Define the input and output file paths
const inputFilePath = path.resolve(__dirname, 'input.ts');
const outputFilePath = path.resolve(__dirname, 'output.ts');
const secondFilePath = path.resolve(__dirname, 'extractedFunctions.ts');

// Parse and extract the code
parseAndExtract(inputFilePath, outputFilePath, secondFilePath);

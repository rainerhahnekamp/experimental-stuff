import "zone.js"
import "zone.js/testing"

import {getTestBed, TestBed, TestModuleMetadata} from '@angular/core/testing';
import {ClickComponent} from './app/click.component';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';
import {extractedFunctionsMap, renderComponentFunctionsMap} from './component-testing/current-test';

console.debug('Extracted Functions: %o', extractedFunctionsMap);
console.debug('Render Functions: %o', renderComponentFunctionsMap);

window.runFunction = (fnCode: string): unknown => {
  console.debug("Searching for function %s", fnCode);
  const functionsMap = extractedFunctionsMap as unknown as Record<number, () => void>
  const fn = Object.values(functionsMap).find(fn => {
    console.log('Comparing %s to %s', fn.toString(), fnCode);
    return fn.toString() === fnCode;
  });
  if (!fn) {
    console.error(`Was not able to find browser function ${fnCode}`);
    return false;
  }

  return fn();
}

window.setupTest = (id: number) => {
  const [Component, testModuleMetaData] = (renderComponentFunctionsMap as unknown as Record<number, [new () => unknown, TestModuleMetadata]>)[id];
  if (!Component) {
    console.error(`Component not found for id ${id}`);
  }
  const fixture = TestBed.configureTestingModule(testModuleMetaData).createComponent(Component);
  fixture.autoDetectChanges(true)
}

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
// const fixture = TestBed.configureTestingModule({imports: [ClickComponent]}).createComponent(ClickComponent);
// fixture.autoDetectChanges(true)

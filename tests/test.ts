import {mergeTests, test as base} from '@playwright/test';
import {type TestModuleMetadata} from '@angular/core/testing';
import {extractBrowserFunctions} from './component-testing/extract-browser-functions';
import * as path from 'node:path';

type RenderFn = (component: new () => unknown, options?: TestModuleMetadata) => Promise<void>

type ComponentTestFixture = {
  renderComponent: RenderFn,
  runInBrowser: (cb: () => void) => Promise<void>,
  sharedContext: Map<string, unknown>,
  testId: { id: string },
  transformer: () => void,

}

const componentTest = base.extend<ComponentTestFixture>({
  testId: [async ({}, use) => {
    await use({id: generateUniqueId()});
  }, {auto: true}],

  transformer: [async ({testId}, use, testInfo) => {
    extractBrowserFunctions(testInfo.file, path.join(testInfo.project.testDir, '../src/component-testing'), ['renderComponent', 'runInBrowser'], testId.id, 'current-test.ts');
    await use(() => {
    });
  }, {auto: true}],

  runInBrowser: async ({page}, use) => {
    await use(async (cb) => {
      return await page.evaluate(fn => window.runFunction(fn), cb.toString());
    });
  },

  renderComponent: async ({page, testId}, use, testInfo) => {
    const line = testInfo.line;
    await use(async () => {
      await page.goto('http://localhost:4200', {waitUntil: 'networkidle'});
      await page.evaluate(({id, testId}) => {
        window.setupTest(id);
      }, {id: line, testId: testId.id});
      await page.waitForFunction((id) => window.testId === id, testId.id);
    });
  },

  sharedContext: async ({}, use) => {
    await use(new Map());
  },
})

function generateUniqueId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

export const test = mergeTests(base, componentTest);

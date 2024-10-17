import {mergeTests, test as base} from '@playwright/test';
import {type TestModuleMetadata} from '@angular/core/testing';
import {extractBrowserFunctions} from './component-testing/extract-browser-functions';
import * as path from 'node:path';

type RenderFn = (component: new () => unknown, options?: TestModuleMetadata) => Promise<void>

type ComponentTestFixture = {
  renderComponent: RenderFn,
  runInBrowser: (cb: () => void) => Promise<void>,
  sharedContext: Map<string, unknown>,
  transformer: () => void
}

const componentTest = base.extend<ComponentTestFixture>({
  runInBrowser: async ({page}, use, testInfo) => {
    const line = testInfo.line;
    await use(async () => {
      await page.evaluate((line) => console.log(`Running function of line ${line}`), line);
    });
  },

  renderComponent: async ({page}, use, testInfo) => {
    const line = testInfo.line;
    await use(async () => {
      await page.evaluate((line) => console.log(`Setting up Test ${line}`), line);
    });
  },

  sharedContext: async ({}, use) => {
    await use(new Map());
  },

  transformer: [async ({}, use, testInfo) => {
    extractBrowserFunctions(testInfo.file, path.join(testInfo.project.testDir, 'component-testing'), ['renderComponent', 'runInBrowser']);
    await use(() => {
    });
  }, {auto: true}]
})

export const test = mergeTests(base, componentTest);

import { mergeTests, test as base } from '@playwright/test';
import { type TestModuleMetadata } from '@angular/core/testing';
import { extractBrowserFunctions } from './component-testing/extract-browser-functions';
import * as path from 'node:path';

type RenderFn = (component: new () => unknown, options?: TestModuleMetadata) => Promise<void>

type ComponentTestFixture = {
  /**
   * Setup the component for testing and open the component test in the browser
   * Can only be executed once, preferably at the beginning of the test. 
   */
  renderComponent: RenderFn,

  /**
   * Runs fn directly in the browser. Can only be executed once per test.
   */
  runInBrowser: (fn: () => void) => Promise<void>,

  /**
   * Same as runInBrowser but can be executed multiple times in the same test
   * That's why it needs an id to identify the function. The id needs to be 
   * **static literal** and unique for the test.
   */
  runInBrowserMulti(cb: () => void, id: string): Promise<void>;

  /**
   * Fetches the Property of a Servic in Angular and returns it.
   * Becaus of its signature, it is safe to run multiple times and
   * the code doesn't have to be transformed.
   */
  getPropertyFromService<T>(Service: new () => T, property: keyof T): Promise<T[keyof T]>;

  /**
   * provides a dictionary which is shared between Browser and Playwright
   */
  sharedContext: Map<string, unknown>;

  /**
   * Extracts all browser-specific functions, writes them to a
   * file which gets compiled by the Angular CLI.
   */
  extractor(): void;

  /**
   * Internal information about the test.
   */
  testId: { id: string, runInBrowserSingletonHappened: boolean, browserRunIds: number[] };
}

const componentTest = base.extend<ComponentTestFixture>({
  renderComponent: async ({ page, testId }, use, testInfo) => {
    const line = testInfo.line;
    await use(async () => {
      await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
      await page.evaluate(({ id, testId }) => {
        window.setupTest(id);
      }, { id: line, testId: testId.id });
      await page.waitForFunction((id) => window.testId === id, testId.id);
    });
  },

  async runInBrowser({ page }, use) {
    await use(async (cb) => {
      return await page.evaluate(fn => window.runFunction(fn), cb.toString());
    });
  },

  runInBrowserMulti: async ({ page }, use) => {
    await use(async (cb) => {
      return await page.evaluate(fn => window.runFunction(fn), cb.toString());
    });
  },

  testId: [async ({ }, use) => {
    await use({ id: generateUniqueId(), runInBrowserSingletonHappened: false, browserRunIds: [] });
  }, { auto: true }],

  extractor: [async ({ testId }, use, testInfo) => {
    extractBrowserFunctions(testInfo.file, path.join(testInfo.project.testDir, '../src/component-testing'), ['renderComponent', 'runInBrowser'], testId.id, 'current-test.ts');
    await use(() => { });
  }, { auto: true }],

  sharedContext: async ({ }, use) => {
    await use(new Map());
  },
})

function generateUniqueId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

export const test = mergeTests(base, componentTest);

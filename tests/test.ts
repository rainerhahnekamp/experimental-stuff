import {mergeTests, test as base} from '@playwright/test';
import {type TestModuleMetadata} from '@angular/core/testing';

type RenderFn = (component: new () => unknown, options?: TestModuleMetadata) => Promise<void>

const componentTest = base.extend<{ renderComponent: RenderFn, runInBrowser: (cb: () => void) => Promise<void>, sharedContext: Map<string, unknown> }>({
  runInBrowser: async ({}, use) => {
    await use((cb: () => void) => Promise.resolve());
  },

  renderComponent: async ({}, use) => {
    console.log('Rendering component');
    await use(() => Promise.resolve());
  },

  sharedContext: async ({}, use) => {
    await use(new Map());
  }
})

export const test = mergeTests(base, componentTest);

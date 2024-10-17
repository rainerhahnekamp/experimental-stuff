import {type test as originalTest, type expect as originalExpect} from '@playwright/test';

const handler = {
  get: function (target: () => true, prop: string) {
    if (prop === 'defineComponentSetup') {
      return () => {}
    }

    return;
  }
}

function testFn() {
}

export const test = new Proxy(testFn, handler) as unknown as typeof originalTest & { defineComponentSetup: (setupCode: () => void) => void, setupComponent: () => void };
export const expect = new Proxy(testFn, handler) as unknown as typeof originalExpect;

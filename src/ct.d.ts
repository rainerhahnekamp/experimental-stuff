
export declare global {
  interface Window {
    testId: string;
    loadTest: (testid: string) => void;
    runFunction(fn: string): void;
    setupTest(id: number): void;
  }
}

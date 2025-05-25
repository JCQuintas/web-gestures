import { expect } from 'vitest';

export type MatcherState = ReturnType<typeof expect.getState>;

interface SyncExpectationResult {
  pass: boolean;
  message: () => string;
  actual?: unknown;
  expected?: unknown;
}

type AsyncExpectationResult = Promise<SyncExpectationResult>;

export type ExpectationResult = SyncExpectationResult | AsyncExpectationResult;

export interface RawMatcherFn<T extends MatcherState = MatcherState> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (this: T, received: any, ...expected: Array<any>): ExpectationResult;
}

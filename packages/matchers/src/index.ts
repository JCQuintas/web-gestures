import { expect } from 'vitest';
import { ToBeClonable, toBeClonable } from './matchers/toBeClonable';
import { ToUpdateOptions, toUpdateOptions } from './matchers/toUpdateOptions';
import { ToUpdateState, toUpdateState } from './matchers/toUpdateState';

export type GestureMatchers<R = unknown> = ToUpdateOptions<R> & ToBeClonable<R> & ToUpdateState<R>;

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends GestureMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends GestureMatchers {}
}

expect.extend({
  toUpdateOptions,
  toBeClonable,
  toUpdateState,
});

import { expect } from 'vitest';
import { ToBeClonable, toBeClonable } from './matchers/toBeClonable';
import { ToUpdateOptions, toUpdateOptions } from './matchers/toUpdateOptions';
import { ToUpdateState, toUpdateState } from './matchers/toUpdateState';

export type GestureMatchers<R = unknown> = ToUpdateOptions<R> & ToBeClonable<R> & ToUpdateState<R>;

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Matchers<T = any> extends GestureMatchers<T> {}
}

expect.extend({
  toUpdateOptions,
  toBeClonable,
  toUpdateState,
});

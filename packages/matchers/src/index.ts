import { expect } from 'vitest';
import { ToBeClonable, toBeClonable } from './matchers/toBeClonable';
import { ToUpdateOptions, toUpdateOptions } from './matchers/toUpdateOptions';
import { ToUpdateState, toUpdateState } from './matchers/toUpdateState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GestureMatchers<R = any> = ToUpdateOptions<R> & ToBeClonable<R> & ToUpdateState<R>;

expect.extend({
  toUpdateOptions,
  toBeClonable,
  toUpdateState,
});

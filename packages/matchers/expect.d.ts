import { ToBeClonable } from './src/matchers/toBeClonable';
import { ToUpdateOptions } from './src/matchers/toUpdateOptions';
import { ToUpdateState } from './src/matchers/toUpdateState';

export type GestureMatchers<R = unknown> = ToUpdateOptions<R> & ToBeClonable<R> & ToUpdateState<R>;

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Matchers<T = any> extends GestureMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends GestureMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends GestureMatchers {}
}

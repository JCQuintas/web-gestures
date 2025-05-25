import { expect } from 'vitest';
import { ToUpdateOptionsTo, toUpdateOptionsTo } from './matchers/toUpdateOptionsTo';

export type GestureMatchers<R = unknown> = ToUpdateOptionsTo<R>;

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends GestureMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends GestureMatchers {}
}

expect.extend({
  toUpdateOptionsTo,
});

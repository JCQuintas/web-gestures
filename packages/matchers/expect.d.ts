import { GestureMatchers } from '@web-gestures/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Matchers<T = any> extends GestureMatchers<T> {}
}

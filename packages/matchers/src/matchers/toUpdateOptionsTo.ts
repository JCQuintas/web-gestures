import { Gesture, PointerManager } from '@web-gestures/core';
import { ActiveGesturesRegistry } from '../../../core/src/ActiveGesturesRegistry';
import { MatcherState, RawMatcherFn } from '../Matcher.types';

export type ToUpdateOptionsTo<R = Gesture<string>> = {
  /**
   * Asserts that the provided gesture options can be updated by emitting a change event
   * and that the options match the expected values.
   *
   * Internally it will emit a custom event on an artificial target element.
   * The event name is derived from the gesture name, e.g. `moveChangeOptions`
   * from the example below.
   *
   * @example
   * ```ts
   * expect(new MoveGesture({ name: 'move' })).toUpdateOptionsTo({ preventIf: ['pan'] });
   * ```
   */
  toUpdateOptionsTo<
    // @ts-expect-error, accessing protected property for testing purposes
    ExpectedOptions extends R['mutableOptionsType'] = R['mutableOptionsType'],
  >(
    expectedOptions: ExpectedOptions
  ): R;
};

export const toUpdateOptionsTo: RawMatcherFn = function <
  G extends Gesture<string>,
  T extends MatcherState = MatcherState,
  // @ts-expect-error, accessing protected property for testing purposes
  MutableOptions = G['mutableOptionsType'],
>(this: T, received: G, expected: MutableOptions) {
  const original = received;
  const expectedOptions = expected;
  const clone = original.clone();
  const target = document.createElement('div');
  document.body.appendChild(target);

  const pointerManager = new PointerManager({});
  const gestureRegistry = new ActiveGesturesRegistry();

  clone.init(target, pointerManager, gestureRegistry);

  const changeOptionsEvent = new CustomEvent(`${clone.name}ChangeOptions`, {
    detail: expectedOptions,
  });

  target.dispatchEvent(changeOptionsEvent);

  document.body.removeChild(target);

  // Check if the options were updated correctly
  // @ts-expect-error, forcing empty object
  const actualOptions: MutableOptions = {};
  // @ts-expect-error, forcing empty object
  const originalOptions: MutableOptions = {};
  for (const key in expectedOptions) {
    if (Reflect.has(clone, key)) {
      // @ts-expect-error, we checked that the key exists
      actualOptions[key] = clone[key];
      // @ts-expect-error, we don't care if the key exists
      originalOptions[key] = original[key];
    }
  }

  const hasUpdated = this.equals(actualOptions, expectedOptions);
  const isSameAsOriginal = this.equals(actualOptions, originalOptions);
  const pass = hasUpdated && !isSameAsOriginal;

  // If pass, we set the message if the "not" condition is true
  if (pass) {
    return {
      pass: true,
      message: () => `Expected options not to be the same, but they were.`,
      actual: actualOptions,
      expected: expectedOptions,
    };
  }

  return {
    pass: false,
    message: () => {
      if (isSameAsOriginal) {
        return 'Expected options are the same as the original, which will automatically fail.';
      }
      return 'Expected options to be the same, but they were not.';
    },
    actual: actualOptions,
    expected: expectedOptions,
  };
};

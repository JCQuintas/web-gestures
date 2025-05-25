import { Gesture, PointerManager } from '@web-gestures/core';
import { ActiveGesturesRegistry } from '../../../core/src/ActiveGesturesRegistry';
import { MatcherState, RawMatcherFn } from '../Matcher.types';

export type ToUpdateOptions<R = Gesture<string>> = {
  /**
   * Asserts that the provided gesture options can be updated by emitting a change event
   * and that the options match the expected values.
   *
   * Internally it will:
   * 1. Clone the gesture to avoid modifying the original
   * 2. Initialize the clone with a temporary element
   * 3. Emit a custom event named `${gestureName}ChangeOptions` with the expected options
   * 4. Verify that the options were properly updated
   * 5. Clean up resources by destroying the gesture and removing the temporary element
   *
   * This matcher is useful for verifying that gestures correctly handle runtime option updates.
   *
   * ## Requirements
   *
   * For this matcher to work correctly, the gesture must:
   * - Properly implement the `clone()` method
   * - Listen for events named `${gestureName}ChangeOptions`
   * - Implement the `updateOptions()` method to update its properties
   * - Have a working `destroy()` method to clean up resources
   *
   * @example
   * ```ts
   * expect(new MoveGesture({ name: 'move' })).toUpdateOptions({ preventDefault: true });
   * ```
   */
  toUpdateOptions<
    // Note: We're using a more explicit type parameter name to indicate what we're expecting
    // @ts-expect-error, accessing protected property for testing purposes
    ExpectedOptions extends Partial<R['mutableOptionsType']> = Partial<R['mutableOptionsType']>,
  >(
    expectedOptions: ExpectedOptions
  ): R;
};

export const toUpdateOptions: RawMatcherFn = function <
  G extends Gesture<string>,
  T extends MatcherState = MatcherState,
  // @ts-expect-error, accessing protected property for testing purposes
  MutableOptions = Partial<G['mutableOptionsType']>,
>(this: T, received: G, expected: MutableOptions) {
  // Validate inputs
  if (!received || typeof received !== 'object') {
    return {
      pass: false,
      message: () => 'Expected a valid gesture instance, but received invalid input.',
    };
  }

  if (!expected || typeof expected !== 'object' || Object.keys(expected).length === 0) {
    return {
      pass: false,
      message: () => 'Expected a non-empty options object, but received invalid or empty options.',
    };
  }

  const original = received;
  const expectedOptions = expected;
  const clone = original.clone();
  const target = document.createElement('div');
  document.body.appendChild(target);

  const pointerManager = new PointerManager({});
  const gestureRegistry = new ActiveGesturesRegistry();

  // Setup the environment for testing
  clone.init(target, pointerManager, gestureRegistry);

  // Create and dispatch the change options event
  const changeOptionsEvent = new CustomEvent(`${clone.name}ChangeOptions`, {
    detail: expectedOptions,
  });

  target.dispatchEvent(changeOptionsEvent);

  // Collect actual and original option values
  // @ts-expect-error, forcing empty object
  const actualOptions: MutableOptions = {};
  // @ts-expect-error, forcing empty object
  const originalOptions: MutableOptions = {};

  // Track which keys didn't update correctly
  const incorrectKeys: string[] = [];

  for (const key in expectedOptions) {
    if (Reflect.has(clone, key)) {
      // @ts-expect-error, we checked that the key exists
      actualOptions[key] = clone[key];
      // @ts-expect-error, we don't care if the key exists
      originalOptions[key] = original[key];

      // Track keys that didn't update as expected
      // @ts-expect-error, we checked that the key exists
      if (!this.equals(clone[key], expectedOptions[key])) {
        incorrectKeys.push(key);
      }
    }
  }

  // Clean up
  clone.destroy();
  document.body.removeChild(target);

  const hasUpdated = this.equals(actualOptions, expectedOptions);
  const isSameAsOriginal = this.equals(actualOptions, originalOptions);
  const pass = hasUpdated && !isSameAsOriginal;

  // If pass, we set the message if the "not" condition is true
  if (pass) {
    return {
      pass: true,
      message: () => 'Expected options not to be updatable to the specified values, but they were.',
      actual: actualOptions,
      expected: expectedOptions,
    };
  }

  return {
    pass: false,
    message: () => {
      if (isSameAsOriginal) {
        return 'Expected options to be updated, but they remained the same as the original.';
      }
      return 'Expected options to be updated to the specified values, but they were not.';
    },
    actual: actualOptions,
    expected: expectedOptions,
  };
};

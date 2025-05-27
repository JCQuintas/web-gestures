import { Gesture, PointerManager } from '@web-gestures/core';
import { ActiveGesturesRegistry } from '../../../core/src/ActiveGesturesRegistry';
import { MatcherState, SyncMatcherFn } from '../Matcher.types';

export type ToUpdateState<R = Gesture<string>> = {
  /**
   * Asserts that the provided gesture state can be updated by emitting a change event
   * and that the state properties match the expected values.
   *
   * Internally it will:
   * 1. Clone the gesture to avoid modifying the original
   * 2. Initialize the clone with a temporary element
   * 3. Emit a custom event named `${gestureName}ChangeState` with the expected state
   * 4. Verify that the state was properly updated
   * 5. Clean up resources by destroying the gesture and removing the temporary element
   *
   * This matcher is useful for verifying that gestures correctly handle runtime state updates.
   *
   * ## Requirements
   *
   * For this matcher to work correctly, the gesture must:
   * - Properly implement the `clone()` method
   * - Listen for events named `${gestureName}ChangeState`
   * - Implement the `updateState()` method to update its state properties
   * - Have a working `destroy()` method to clean up resources
   *
   * @example
   * ```ts
   * // Check if gesture state can be updated
   * expect(new MoveGesture({ name: 'move' })).toUpdateState({
   *   isDragging: true,
   *   startPosition: { x: 100, y: 100 }
   * });
   * ```
   */
  toUpdateState<
    // @ts-expect-error, accessing protected property for testing purposes
    ExpectedState extends Partial<R['mutableStateType']> = Partial<R['mutableStateType']>,
  >(
    expectedState: ExpectedState
  ): R;
};

export const toUpdateState: SyncMatcherFn = function <
  G extends Gesture<string>,
  T extends MatcherState = MatcherState,
  // @ts-expect-error, accessing protected property for testing purposes
  MutableState = Partial<G['mutableStateType']>,
>(this: T, received: G, expected: MutableState) {
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
      message: () => 'Expected a non-empty state object, but received invalid or empty state.',
    };
  }

  const original = received;
  const expectedState = expected;
  const clone = original.clone();
  const target = document.createElement('div');
  document.body.appendChild(target);

  const pointerManager = new PointerManager({});
  const gestureRegistry = new ActiveGesturesRegistry();

  // Setup the environment for testing
  clone.init(target, pointerManager, gestureRegistry);

  // Create and dispatch the change state event
  const changeStateEvent = new CustomEvent(`${clone.name}ChangeState`, {
    detail: expectedState,
  });

  target.dispatchEvent(changeStateEvent);

  // Check if state was updated correctly
  // We need to access the state which is a protected property
  const actualStateValues: Partial<MutableState> = {};
  const originalStateValues: Partial<MutableState> = {};

  // Track which keys didn't update correctly
  const incorrectKeys: string[] = [];

  // @ts-expect-error, accessing protected property for testing
  const cloneState = clone.state;
  // @ts-expect-error, accessing protected property for testing
  const originalState = original.state;

  // Only compare keys that are in the expected state
  for (const key in expectedState) {
    if (Reflect.has(cloneState, key)) {
      // @ts-expect-error, we checked that the key exists
      actualStateValues[key] = cloneState[key];
      // @ts-expect-error, we don't care if the key exists
      originalStateValues[key] = originalState[key];

      // Track keys that didn't update as expected
      // @ts-expect-error, we checked that the key exists
      if (!this.equals(cloneState[key], expectedState[key])) {
        incorrectKeys.push(key);
      }
    }
  }

  // Clean up
  clone.destroy();
  document.body.removeChild(target);

  const hasUpdated = this.equals(actualStateValues, expectedState);
  const isSameAsOriginal = this.equals(originalStateValues, expectedState);
  const pass = hasUpdated && !isSameAsOriginal;

  // If pass, we set the message if the "not" condition is true
  if (pass) {
    return {
      pass: true,
      message: () => 'Expected state not to be updatable to the specified values, but it was.',
      actual: actualStateValues,
      expected: expectedState,
    };
  }

  return {
    pass: false,
    message: () => {
      if (isSameAsOriginal) {
        return 'Expected state to be updated, but it remained the same as the original.';
      }
      return 'Expected state to be updated to the specified values, but it was not.';
    },
    actual: actualStateValues,
    expected: expectedState,
  };
};

import { Gesture } from '@web-gestures/core';
import { MatcherState, SyncMatcherFn } from '../Matcher.types';

export type ToBeClonable<R = unknown> = {
  /**
   * Asserts that the provided gesture can be cloned and that the clone
   * has the same properties as the original gesture, or overridden properties
   * if specified.
   *
   * @example
   * ```ts
   * // Check if the gesture can be cloned with the same properties
   * expect(new MoveGesture({ name: 'move' })).toBeClonable();
   *
   * // Check if the gesture can be cloned with overridden properties
   * expect(new MoveGesture({ name: 'move' })).toBeClonable({
   *   preventDefault: true,
   *   stopPropagation: true
   * });
   * ```
   */
  toBeClonable<
    G extends Gesture<string>,
    // @ts-expect-error, accessing protected property for testing purposes
    OverrideOptions extends Partial<G['mutableOptionsType']> = Record<string, unknown>,
  >(
    overrides?: OverrideOptions
  ): R;
};

export const toBeClonable: SyncMatcherFn = function <
  G extends Gesture<string>,
  T extends MatcherState = MatcherState,
  // @ts-expect-error, accessing protected property for testing purposes
  OverrideOptions extends Partial<G['mutableOptionsType']> = Record<string, unknown>,
>(this: T, received: G, expected?: OverrideOptions) {
  // Validate inputs
  if (!received || typeof received !== 'object') {
    return {
      pass: false,
      message: () => 'Expected a valid gesture instance, but received invalid input.',
    };
  }

  if (expected !== null && expected !== undefined && typeof expected !== 'object') {
    return {
      pass: false,
      message: () => 'Expected valid options, but received an invalid value.',
    };
  }

  const original = received;
  const overrides = expected;
  const clone = original.clone(overrides);

  // Check that the clone is a different instance
  const isNotSameInstance = original !== clone;
  const isInstanceOfGesture = clone instanceof Gesture;

  // Check that overridden properties were applied
  let overridesApplied = true;
  if (overrides) {
    for (const key in overrides) {
      if (Reflect.has(clone, key)) {
        // @ts-expect-error, we checked that the key exists
        const valueMatches = this.equals(clone[key], overrides[key]);
        if (!valueMatches) {
          overridesApplied = false;
          break;
        }
      }
    }
  }

  // Check that non-overridden properties match the original
  let nonOverriddenPropertiesMatch = true;
  for (const key in original) {
    // Skip checking overridden properties and functions
    if (overrides && key in overrides) continue;
    if (typeof original[key] === 'function') continue;

    if (Reflect.has(clone, key)) {
      // @ts-expect-error, we checked that the key exists
      const valueMatches = this.equals(clone[key], original[key]);
      if (!valueMatches) {
        nonOverriddenPropertiesMatch = false;
        break;
      }
    }
  }

  const pass =
    isNotSameInstance && isInstanceOfGesture && overridesApplied && nonOverriddenPropertiesMatch;

  if (pass) {
    return {
      pass: true,
      message: () => `Expected gesture not to be clonable, but it was.`,
    };
  }

  return {
    pass: false,
    message: () => {
      if (!isInstanceOfGesture) {
        return 'Expected clone to be an instance of Gesture, but it is not.';
      } else if (!overridesApplied) {
        return 'Expected clone to have overridden properties applied, but it does not.';
      } else if (!nonOverriddenPropertiesMatch) {
        return 'Expected non-overridden properties to match the original, but they do not.';
      }

      return 'Expected clone to be a different instance than the original, but they are the same.';
    },
  };
};

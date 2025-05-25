import { Gesture } from '@web-gestures/core';
import { describe, expect, it } from 'vitest';
import { getFakeState } from '../equals';
import { toBeClonable } from './toBeClonable';

class GoodGesture extends Gesture<string> {
  protected readonly state = {};
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: { preventDefault?: boolean };
  protected readonly mutableStateType!: never;
  protected resetState(): void {}

  public clone(overrides?: Record<string, unknown>): GoodGesture {
    return new GoodGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      preventIf: this.preventIf,
      ...overrides,
    });
  }

  // Extra property for coverage
  public extra = () => {};
}

class BadGesture extends Gesture<string> {
  protected readonly state = {};
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: { preventDefault?: boolean };
  protected readonly mutableStateType!: never;
  protected resetState(): void {}

  public clone(): BadGesture {
    return this;
  }
}

class BadInstanceGesture extends Gesture<string> {
  protected readonly state = {};
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: { preventDefault?: boolean };
  protected readonly mutableStateType!: never;
  protected resetState(): void {}

  public clone(overrides?: Record<string, unknown>): BadInstanceGesture {
    return {
      name: this.name,
      ...overrides,
    } as BadInstanceGesture;
  }
}

class BadOverrideGesture extends Gesture<string> {
  protected readonly state = {};
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: { preventDefault?: boolean };
  protected readonly mutableStateType!: never;
  protected resetState(): void {}

  public clone(): BadOverrideGesture {
    return new BadOverrideGesture({
      name: this.name,
    });
  }
}

class BadNonOverrideGesture extends Gesture<string> {
  protected readonly state = {};
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: { preventDefault?: boolean };
  protected readonly mutableStateType!: never;
  protected resetState(): void {}

  public clone(overrides?: Record<string, unknown>): BadNonOverrideGesture {
    return new BadNonOverrideGesture({
      name: this.name,
      preventDefault: true,
      ...overrides,
    });
  }
}

const matcher = toBeClonable.bind(getFakeState());
const goodGesture = new GoodGesture({ name: 'fake' });
const badGesture = new BadGesture({ name: 'fake' });
const badInstanceGesture = new BadInstanceGesture({ name: 'fake' });
const badOverrideGesture = new BadOverrideGesture({ name: 'fake' });
const badNonOverrideGesture = new BadNonOverrideGesture({ name: 'fake' });

describe('toBeClonable matcher', () => {
  it('should pass when a gesture can be cloned', () => {
    const result = matcher(goodGesture);
    expect(result.pass).toBe(true);
  });

  it('should provide the correct "not" message when passing', () => {
    const result = matcher(goodGesture);
    expect(result.pass).toBe(true);
    expect(result.message()).toBe('Expected gesture not to be clonable, but it was.');
  });

  it('should pass when a gesture can be cloned with overrides', () => {
    const goodGesture = new GoodGesture({
      name: 'fake',
      preventDefault: false,
      stopPropagation: false,
      preventIf: [],
    });

    const result = matcher(goodGesture, {
      preventDefault: true,
      stopPropagation: true,
      preventIf: ['pan', 'pinch'],
    });
    expect(result.pass).toBe(true);
  });

  it('should pass for different gesture types', () => {
    const goodGesture = new GoodGesture({
      name: 'move',
      preventDefault: true,
      stopPropagation: true,
      preventIf: ['pan'],
    });

    // Should pass when overriding some options
    const resultSomeOptions = matcher(goodGesture, { preventDefault: false });
    expect(resultSomeOptions.pass).toBe(true);

    // Should pass when overriding with the same values
    const resultSameOptions = matcher(goodGesture, {
      preventDefault: true,
      stopPropagation: true,
    });
    expect(resultSameOptions.pass).toBe(true);
  });

  it('should not pass when the clone is the same instance as the original', () => {
    const result = matcher(badGesture);
    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected clone to be a different instance than the original, but they are the same.'
    );
  });

  it('should not pass when the clone is not an instance of Gesture', () => {
    const result = matcher(badInstanceGesture);
    expect(result.pass).toBe(false);
    expect(result.message()).toBe('Expected clone to be an instance of Gesture, but it is not.');
  });

  it('should not pass when the clone does not have overridden properties applied', () => {
    const result = matcher(badOverrideGesture, { preventDefault: true });
    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected clone to have overridden properties applied, but it does not.'
    );
  });

  it('should not pass when non-overridden properties do not match the original', () => {
    const result = matcher(badNonOverrideGesture);
    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected non-overridden properties to match the original, but they do not.'
    );
  });

  it('should handle invalid inputs gracefully', () => {
    const result = matcher(goodGesture, false);
    expect(result.pass).toBe(false);
    expect(result.message()).toBe('Expected valid options, but received an invalid value.');
  });

  it('should handle invalid gesture instances gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = matcher(null as any);
    expect(result.pass).toBe(false);
    expect(result.message()).toBe('Expected a valid gesture instance, but received invalid input.');
  });
});

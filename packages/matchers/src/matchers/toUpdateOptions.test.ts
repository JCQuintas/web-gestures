import { Gesture } from '@web-gestures/core';
import { describe, expect, it } from 'vitest';
import { getFakeState } from '../equals';
import { toUpdateOptions } from './toUpdateOptions';

class GoodGesture extends Gesture<string> {
  protected readonly state = {};
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    preventIf?: string[];
    complexOption?: { nestedValue: number; enabled: boolean };
    arrayOption?: string[];
  };
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

  // Add custom properties for testing complex options
  public complexOption?: { nestedValue: number; enabled: boolean };
  public arrayOption?: string[];

  // Override the updateOptions method to handle our custom properties
  protected updateOptions(options: typeof this.mutableOptionsType): void {
    super.updateOptions(options);
    this.complexOption = options.complexOption ?? this.complexOption;
    this.arrayOption = options.arrayOption ?? this.arrayOption;
  }
}

class BadGesture extends Gesture<string> {
  protected readonly state = {};
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: { preventDefault?: boolean };
  protected readonly mutableStateType!: never;
  protected resetState(): void {}

  public clone(overrides?: Record<string, unknown>): BadGesture {
    return new BadGesture({
      name: this.name,
      ...overrides,
    });
  }

  // We remove the updateOptions implementation
  protected updateOptions(): void {}
}

const matcher = toUpdateOptions.bind(getFakeState());

describe('toUpdateOptions matcher', () => {
  it('should pass when a gesture can be updated through events', () => {
    const goodGesture = new GoodGesture({ name: 'fake' });

    const result = matcher(goodGesture, { preventDefault: true });
    expect(result.pass).toBe(true);
  });

  it('should provide the correct "not" message when passing', () => {
    const goodGesture = new GoodGesture({ name: 'fake' });

    const result = matcher(goodGesture, { preventDefault: true });
    expect(result.pass).toBe(true);
    expect(result.message()).toBe(
      'Expected options not to be updatable to the specified values, but they were.'
    );
  });

  it('should not pass when options are same as default', () => {
    const goodGesture = new GoodGesture({ name: 'fake' });

    const result = matcher(goodGesture, { preventDefault: false });
    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected options to be updated, but they remained the same as the original.'
    );
  });

  it('should not pass when options are not updated', () => {
    const badGesture = new BadGesture({ name: 'fake' });

    const result = matcher(badGesture, { preventDefault: 'fake' });
    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected options to be updated to the specified values, but they were not.'
    );
  });

  it('should not pass handling invalid inputs', () => {
    const goodGesture = new GoodGesture({ name: 'fake' });

    const result = matcher(goodGesture, {});

    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected a non-empty options object, but received invalid or empty options.'
    );
  });

  it('should not pass hangling invalid gesture instances', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = matcher(null as any, { preventDefault: true });

    expect(result.pass).toBe(false);
    expect(result.message()).toBe('Expected a valid gesture instance, but received invalid input.');
  });
});

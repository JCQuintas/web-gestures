import { Gesture } from '@web-gestures/core';
import { describe, expect, it } from 'vitest';
import '../index';

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

describe('toBeClonable matcher', () => {
  it('should pass when a gesture can be cloned', () => {
    const goodGesture = new GoodGesture({ name: 'fake' });

    expect(goodGesture).toBeClonable();
  });

  it('should pass when a gesture can be cloned with overrides', () => {
    const goodGesture = new GoodGesture({
      name: 'fake',
      preventDefault: false,
      stopPropagation: false,
      preventIf: [],
    });

    expect(goodGesture).toBeClonable({
      preventDefault: true,
      stopPropagation: true,
      preventIf: ['pan', 'pinch'],
    });
  });

  it('should work with the .not modifier', () => {
    const badGesture = new BadGesture({ name: 'fake' });

    // The matcher should fail because clone returns the same instance
    expect(badGesture).not.toBeClonable();
  });

  it('should pass for different gesture types', () => {
    const goodGesture = new GoodGesture({
      name: 'move',
      preventDefault: true,
      stopPropagation: true,
      preventIf: ['pan'],
    });

    // Should pass for a gesture with options already set
    expect(goodGesture).toBeClonable();

    // Should pass when overriding some options
    expect(goodGesture).toBeClonable({
      preventDefault: false,
    });

    // Should pass when overriding with the same values
    expect(goodGesture).toBeClonable({
      preventDefault: true,
      stopPropagation: true,
    });
  });
});

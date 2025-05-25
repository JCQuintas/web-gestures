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

  public clone(overrides?: Record<string, unknown>): GoodGesture {
    return new GoodGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      ...overrides,
    });
  }

  protected resetState(): void {}
}

class BadGesture extends Gesture<string> {
  protected readonly state = {};
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: { preventDefault?: boolean };
  protected readonly mutableStateType!: never;

  public clone(overrides?: Record<string, unknown>): BadGesture {
    return new BadGesture({
      name: this.name,
      ...overrides,
    });
  }

  // We remove the updateOptions implementation
  protected updateOptions(): void {}
  protected resetState(): void {}
}

describe('toUpdateOptionsTo matcher', () => {
  it('should pass when a gesture can be updated through events', () => {
    const goodGesture = new GoodGesture({ name: 'fake' });

    expect(goodGesture).toUpdateOptionsTo({ preventDefault: true });
  });

  it(
    'should fail when using .not on a gesture that can be updated through events',
    { fails: true },
    () => {
      const goodGesture = new GoodGesture({ name: 'fake' });

      expect(goodGesture).not.toUpdateOptionsTo({ preventDefault: true });
    }
  );

  it(
    'should fail when a gesture works correctly, but the passed options are the same as the defaults',
    { fails: true },
    () => {
      const goodGesture = new GoodGesture({ name: 'fake' });

      expect(goodGesture).toUpdateOptionsTo({ preventDefault: false });
    }
  );

  it('should pass when using .not on a gesture that cannot be updated through events', () => {
    const badGesture = new BadGesture({ name: 'fake' });

    // @ts-expect-error, using a string for error to be clearer
    expect(badGesture).not.toUpdateOptionsTo({ preventDefault: 'fake' });
  });

  it('should fail when a gesture cannot be updated through events', { fails: true }, () => {
    const badGesture = new BadGesture({ name: 'fake' });

    // @ts-expect-error, using a string for error to be clearer
    expect(badGesture).toUpdateOptionsTo({ preventDefault: 'fake' });
  });
});

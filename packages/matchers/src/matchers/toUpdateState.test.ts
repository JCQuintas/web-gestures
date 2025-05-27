import { Gesture } from '@web-gestures/core';
import { describe, expect, it } from 'vitest';

import { GestureState } from '../../../core/src/Gesture';
import { getFakeState } from '../equals';
import '../index';
import { toUpdateState } from './toUpdateState';

type State = GestureState & {
  isDragging: boolean;
  startPosition: { x: number; y: number };
  currentDistance?: number;
  customValue?: string;
};

class GoodGesture extends Gesture<string> {
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: never;
  protected readonly mutableStateType!: State;

  // Define state and mutableStateType for the gesture
  protected state: State = {
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentDistance: 0,
    customValue: '',
  };

  protected resetState(): void {
    this.state = {
      isDragging: false,
      startPosition: { x: 0, y: 0 },
      currentDistance: 0,
      customValue: '',
    };
  }

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
  protected state: State = {
    isDragging: false,
    startPosition: { x: 0, y: 0 },
  };
  protected readonly isSinglePhase!: false;
  protected readonly eventType!: never;
  protected readonly optionsType!: never;
  protected readonly mutableOptionsType!: never;
  protected readonly mutableStateType!: State;

  protected resetState(): void {
    this.state = {
      isDragging: false,
      startPosition: { x: 0, y: 0 },
    };
  }

  public clone(overrides?: Record<string, unknown>): BadGesture {
    return new BadGesture({
      name: this.name,
      ...overrides,
    });
  }

  // Override updateState to prevent updates
  // This simulates a broken implementation
  protected updateState(_: typeof this.mutableOptionsType): void {
    // Deliberately do nothing
  }
}

const matcher = toUpdateState.bind(getFakeState());
const goodGesture = new GoodGesture({ name: 'fake' });
const badGesture = new BadGesture({ name: 'fake' });

describe('toUpdateState matcher', () => {
  it('should pass when a gesture state can be updated through events', () => {
    const result = matcher(goodGesture, {
      isDragging: true,
      startPosition: { x: 100, y: 200 },
    });
    expect(result.pass).toBe(true);
  });

  it('should provide the correct "not" message when passing', () => {
    const result = matcher(goodGesture, { isDragging: true });
    expect(result.pass).toBe(true);
    expect(result.message()).toBe(
      'Expected state not to be updatable to the specified values, but it was.'
    );
  });

  it('should not pass when options are same as default', () => {
    const result = matcher(goodGesture, { isDragging: false });
    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected state to be updated, but it remained the same as the original.'
    );
  });

  it('should not pass when state is not updated', () => {
    const result = matcher(badGesture, {
      isDragging: true,
      startPosition: { x: 100, y: 200 },
    });
    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected state to be updated to the specified values, but it was not.'
    );
  });

  it('should not pass when handling invalid inputs', () => {
    const result = matcher(goodGesture, {});
    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'Expected a non-empty state object, but received invalid or empty state.'
    );
  });

  it('should not pass when handling invalid gesture instances', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = matcher(null as any, { preventDefault: true });
    expect(result.pass).toBe(false);
    expect(result.message()).toBe('Expected a valid gesture instance, but received invalid input.');
  });
});

import { Point } from './types/Point';

/**
 * Options common to all gesture simulators.
 */
export interface GestureSimulatorOptions {
  /**
   * The element to perform the gesture on.
   */
  element: HTMLElement | SVGElement;

  /**
   * Custom function to replace setTimeout for advancing timers in tests.
   * Useful for testing with fake timers.
   * @param ms Number of milliseconds to advance the timer
   * @returns Promise that resolves when the timer has advanced
   */
  advanceTimers?: (ms: number) => Promise<void>;
}

/**
 * Base class for simulating gestures in a testing environment.
 * Provides common utilities for gesture simulators.
 */
export class GestureSimulator {
  protected element: HTMLElement | SVGElement;
  protected advanceTimers?: (ms: number) => Promise<void>;

  constructor(options: GestureSimulatorOptions) {
    this.element = options.element;
    this.advanceTimers = options.advanceTimers;
  }

  /**
   * Delays execution for the specified time.
   * Uses the advanceTimers if provided, otherwise falls back to setTimeout.
   */
  protected delay(ms: number): Promise<void> {
    if (this.advanceTimers) {
      return this.advanceTimers(ms);
    }
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Linearly interpolates between two points.
   */
  protected lerp(start: Point, end: Point, t: number): Point {
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };
  }
}

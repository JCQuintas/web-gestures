/**
 * Base class for simulating gestures in a testing environment.
 * Provides common utilities for gesture simulators.
 */
import { BaseSimulatorOptions, Point } from './types';

export class GestureSimulator {
  protected element: HTMLElement | SVGElement;
  protected advanceTimers?: (ms: number) => Promise<void>;

  constructor(options: BaseSimulatorOptions) {
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

  /**
   * Generates points along a line from start to end.
   */
  protected generatePoints(start: Point, end: Point, steps: number): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push(this.lerp(start, end, t));
    }
    return points;
  }
}

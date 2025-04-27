/**
 * Simulates a pan (drag) gesture for testing.
 */
import { GestureSimulator } from '../GestureSimulator';
import { PanSimulatorOptions } from '../types';

export class PanSimulator extends GestureSimulator {
  private options: PanSimulatorOptions;

  constructor(options: PanSimulatorOptions) {
    super(options);
    this.options = options;
  }

  /**
   * Simulates a pan gesture from start to end point.
   */
  public async simulatePan(): Promise<void> {
    const {
      start,
      end,
      steps = 10,
      duration = 300,
      skipPointerDown = false,
      skipPointerUp = false,
    } = this.options;

    // Calculate delay between steps
    const stepDelay = duration / steps;

    // Generate intermediate points
    const points = this.generatePoints(start, end, steps);

    // Trigger pointerdown at start position
    if (!skipPointerDown) {
      this.pointerDown(start);
    }

    // Move through intermediate points
    for (let i = 1; i < points.length; i++) {
      await this.delay(stepDelay);
      this.pointerMove(points[i]);
    }

    // Trigger pointerup at end position
    if (!skipPointerUp) {
      await this.delay(stepDelay);
      this.pointerUp(end);
    }
  }
}

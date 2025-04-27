/**
 * Simulates a move (hover) gesture for testing move interactions.
 */
import { GestureSimulator } from '../GestureSimulator';
import { MoveSimulatorOptions } from '../types';

export class MoveSimulator extends GestureSimulator {
  private options: MoveSimulatorOptions;

  constructor(options: MoveSimulatorOptions) {
    super(options);
    if (options.pointerType === 'touch') {
      throw new Error(`MoveSimulator doesn't support the touch pointer type.`);
    }
    this.options = { ...options };
  }

  /**
   * Simulates a move (hover) gesture from start to end point.
   */
  public async simulateMove(): Promise<void> {
    const { start, end, steps = 10, duration = 300 } = this.options;

    // Calculate delay between steps
    const stepDelay = duration / steps;

    // Generate intermediate points
    const points = this.generatePoints(start, end, steps);

    // Simulate pointerenter first
    this.dispatchPointerEvent('pointerenter', start);

    // Move through all points
    for (const point of points) {
      this.dispatchPointerEvent('pointermove', point);
      await this.delay(stepDelay);
    }

    // Finish with pointerleave if requested
    if (this.options.skipPointerUp !== true) {
      this.dispatchPointerEvent('pointerleave', end);
    }
  }
}

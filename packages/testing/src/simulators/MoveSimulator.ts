import {
  PointerGestureSimulator,
  PointerGestureSimulatorOptions,
} from '../PointerGestureSimulator';
import { Point } from '../types/Point';

/**
 * Options for a move gesture simulation.
 */
export type MoveSimulatorOptions = PointerGestureSimulatorOptions & {
  /**
   * Starting point of the move.
   */
  start: Point;

  /**
   * End point of the move.
   */
  end: Point;

  /**
   * Number of intermediary events to dispatch.
   * @default 10
   */
  steps?: number;

  /**
   * Duration of the gesture in milliseconds.
   *
   * Will be used to calculate the delay between each step.
   *
   * @default 300
   */
  duration?: number;
};

/**
 * Simulates a move (hover) gesture for testing move interactions.
 */
export class MoveSimulator extends PointerGestureSimulator {
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
    if (this.pointerType !== 'mouse') {
      throw new Error(`MoveSimulator should only be used with the 'mouse' pointer type.`);
    }

    const { start, end, steps = 10, duration = 300 } = this.options;

    // Calculate delay between steps
    const stepDelay = duration / steps;

    const pointers = this.generatePointers();

    for (let i = 0; i <= steps; i++) {
      // Calculate the current position using linear interpolation
      const currentPosition = this.lerp(start, end, i / steps);
      const positions = this.distributeAroundCenter(currentPosition);

      pointers.forEach((pointer, index) => {
        pointer.pointerMove(positions[index]);
      });

      if (i < steps - 1) {
        await this.delay(stepDelay);
      }
    }
  }
}

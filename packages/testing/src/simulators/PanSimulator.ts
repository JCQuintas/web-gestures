import {
  PointerGestureSimulator,
  PointerGestureSimulatorOptions,
} from '../PointerGestureSimulator';
import { Point } from '../types/Point';

/**
 * Options for a pan gesture simulation.
 */
export type PanSimulatorOptions = PointerGestureSimulatorOptions & {
  /**
   * Starting point of the pan gesture.
   */
  start: Point;

  /**
   * End point of the pan gesture.
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
 * Simulates a pan (drag) gesture for testing.
 */
export class PanSimulator extends PointerGestureSimulator {
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

    const pointers = this.generatePointers();

    // Trigger pointerdown at start position
    if (!skipPointerDown) {
      const positions = this.distributeAroundCenter(start);
      pointers.forEach((pointer, index) => {
        pointer.pointerDown(positions[index]);
      });
    }

    // Move through intermediate points
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

    // Trigger pointerup at end position
    if (!skipPointerUp) {
      const positions = this.distributeAroundCenter(end);
      await this.delay(stepDelay);
      pointers.forEach((pointer, index) => {
        pointer.pointerUp(positions[index]);
      });
    }
  }
}

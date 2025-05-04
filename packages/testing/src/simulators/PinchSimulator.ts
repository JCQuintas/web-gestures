import {
  PointerGestureSimulator,
  PointerGestureSimulatorOptions,
} from '../PointerGestureSimulator';
import { Point } from '../types/Point';

/**
 * Options for a pinch gesture simulation.
 */
export type PinchSimulatorOptions = PointerGestureSimulatorOptions & {
  /**
   * Center point of the pinch gesture.
   */
  center: Point;

  /**
   * Initial distance between the two pointers.
   */
  startDistance: number;

  /**
   * Final distance between the two pointers.
   */
  endDistance: number;

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
 * Simulates a pinch gesture for testing.
 */
export class PinchSimulator extends PointerGestureSimulator {
  private options: PinchSimulatorOptions;

  constructor(options: PinchSimulatorOptions) {
    super({
      pointerAmount: 2,
      ...options,
    });
    this.options = options;
    if (options.pointerType === 'mouse') {
      throw new Error(`PinchSimulator doesn't support the mouse pointer type.`);
    }
    if ((options as { pointerAmount?: number }).pointerAmount ?? 2 < 2) {
      throw new Error(`PinchSimulator requires at least 2 pointers.`);
    }
  }

  /**
   * Simulates a pinch gesture.
   */
  public async simulatePinch(): Promise<void> {
    const {
      center,
      startDistance,
      endDistance,
      steps = 10,
      duration = 300,
      skipPointerDown = false,
      skipPointerUp = false,
    } = this.options;

    // Calculate delay between steps
    const stepDelay = duration / steps;

    // Calculate distance increment per step
    const distanceIncrement = (endDistance - startDistance) / steps;

    // Calculate start positions
    const positions = this.distributeAroundCenter(center, startDistance);
    const pointers = this.generatePointers();

    // Start the gesture with pointerdown events
    if (!skipPointerDown) {
      pointers.forEach((pointer, index) => {
        pointer.pointerDown(positions[index]);
      });
    }

    // Simulate the pinch gesture
    for (let i = 0; i <= steps; i++) {
      // Calculate the current distance
      const currentDistance = startDistance + distanceIncrement * i;

      // Calculate the new positions based on the current distance
      const newPositions = this.distributeAroundCenter(center, currentDistance);

      // Move pointers to the new positions
      pointers.forEach((pointer, index) => {
        pointer.pointerMove(newPositions[index]);
      });

      // Wait for the specified delay
      await this.delay(stepDelay);
    }
    // End the gesture with pointerup events
    if (!skipPointerUp) {
      pointers.forEach((pointer, index) => {
        pointer.pointerUp(positions[index]);
      });
    }
  }
}

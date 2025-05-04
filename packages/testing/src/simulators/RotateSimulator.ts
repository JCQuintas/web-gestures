import {
  PointerGestureSimulator,
  PointerGestureSimulatorOptions,
} from '../PointerGestureSimulator';
import { Point } from '../types/Point';

/**
 * Options for a rotate gesture simulation.
 */
export type RotateSimulatorOptions = PointerGestureSimulatorOptions & {
  /**
   * Center point of the rotation.
   */
  center: Point;

  /**
   * Radius of the rotation in pixels.
   * @default 50
   */
  radius?: number;

  /**
   * Starting angle in degrees.
   * @default 0
   */
  startAngle?: number;

  /**
   * Ending angle in degrees.
   * @default 90
   */
  endAngle?: number;

  /**
   * Number of intermediary events to dispatch.
   * @default 10
   */
  steps?: number;

  /**
   * Duration of the gesture in milliseconds.
   *
   * Will be used to calculate the delay between each step.
   * @default 300
   */
  duration?: number;
};

/**
 * Simulates a rotate gesture for testing.
 */
export class RotateSimulator extends PointerGestureSimulator {
  private options: RotateSimulatorOptions;

  constructor(options: RotateSimulatorOptions) {
    super({
      pointerAmount: 2,
      ...options,
    });
    this.options = options;
    if (options.pointerType === 'mouse') {
      throw new Error(`RotateSimulator doesn't support the mouse pointer type.`);
    }
    if ((options as { pointerAmount?: number }).pointerAmount ?? 2 < 2) {
      throw new Error(`RotateSimulator requires at least 2 pointers.`);
    }
  }

  /**
   * Simulates a rotate gesture.
   */
  public async simulateRotate(): Promise<void> {
    const {
      center,
      radius = 50,
      startAngle = 0,
      endAngle = 90,
      steps = 10,
      duration = 300,
      skipPointerDown = false,
      skipPointerUp = false,
    } = this.options;

    // Calculate delay between steps
    const stepDelay = duration / steps;

    // Calculate angle increment per step
    const angleIncrement = (endAngle - startAngle) / steps;

    // Calculate the initial positions of the pointers
    const positions = this.distributeAroundCenter(center, radius, startAngle);
    const pointers = this.generatePointers();

    // Trigger pointerdown at the initial positions
    if (!skipPointerDown) {
      pointers.forEach((pointer, i) => {
        pointer.pointerDown(positions[i]);
      });
    }
    // Simulate the rotation in steps
    for (let i = 0; i < steps; i++) {
      // Calculate the new angle for this step
      const angle = startAngle + angleIncrement * (i + 1);

      // Calculate the new positions of the pointers
      const newPositions = this.distributeAroundCenter(center, radius, angle);

      // Trigger pointermove at the new positions
      pointers.forEach((pointer, i) => {
        pointer.pointerMove(newPositions[i]);
      });

      // Wait for the specified delay before the next step
      await this.delay(stepDelay);
    }
    // Trigger pointerup if not skipped
    if (!skipPointerUp) {
      pointers.forEach((pointer, i) => {
        pointer.pointerUp(positions[i]);
      });
    }
  }
}

import {
  PointerGestureSimulator,
  PointerGestureSimulatorOptions,
} from '../PointerGestureSimulator';
import { Point } from '../types/Point';

/**
 * Options for a press gesture simulation.
 */
export type PressSimulatorOptions = PointerGestureSimulatorOptions & {
  /**
   * Position of the press.
   */
  position: Point;

  /**
   * Duration of the press in milliseconds.
   *
   * @default 500
   */
  duration?: number;
};

/**
 * Simulates a press gesture for testing.
 */
export class PressSimulator extends PointerGestureSimulator {
  private options: PressSimulatorOptions;

  constructor(options: PressSimulatorOptions) {
    super(options);
    this.options = options;
  }

  /**
   * Simulates a press gesture at the specified position.
   */
  public async simulatePress(): Promise<void> {
    const { position, duration = 500, skipPointerUp = false } = this.options;

    const positions = this.distributeAroundCenter(position);
    const pointers = this.generatePointers();

    // Trigger pointerdown at the position
    pointers.forEach((pointer, i) => {
      pointer.pointerDown(positions[i]);
    });

    // Wait for the specified duration
    await this.delay(duration);

    // Trigger pointerup if not skipped
    if (!skipPointerUp) {
      pointers.forEach((pointer, i) => {
        pointer.pointerUp(positions[i]);
      });
    }
  }
}

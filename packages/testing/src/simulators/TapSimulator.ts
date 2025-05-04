import {
  PointerGestureSimulator,
  PointerGestureSimulatorOptions,
} from '../PointerGestureSimulator';
import { Point } from '../types/Point';

/**
 * Options for a tap gesture simulation.
 */
export type TapSimulatorOptions = PointerGestureSimulatorOptions & {
  /**
   * Position of the tap.
   */
  position: Point;

  /**
   * Number of taps to perform.
   * @default 1
   */
  taps?: number;

  /**
   * Delay between taps in milliseconds.
   * @default 100s
   */
  delay?: number;
};

export class TapSimulator extends PointerGestureSimulator {
  private options: TapSimulatorOptions;

  constructor(options: TapSimulatorOptions) {
    super(options);
    this.options = options;
  }

  /**
   * Simulates a tap gesture at the specified position.
   */
  public async simulateTap(): Promise<void> {
    const { position, taps = 1, delay: tapDelay = 100 } = this.options;

    for (let i = 0; i < taps; i++) {
      // Trigger pointerdown at the position
      const positions = this.distributeAroundCenter(position);
      const pointers = this.generatePointers();

      pointers.forEach((pointer, index) => {
        pointer.pointerDown(positions[index]);
      });

      await this.delay(10);

      pointers.forEach((pointer, index) => {
        pointer.pointerUp(positions[index]);
      });

      if (i < taps - 1) {
        await this.delay(tapDelay);
      }
    }
  }
}

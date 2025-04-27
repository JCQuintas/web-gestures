/**
 * Simulates a tap gesture for testing.
 */
import { PointerGestureSimulator } from '../PointerGestureSimulator';
import { TapSimulatorOptions } from '../types';

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
      this.pointerDown(position);

      // Wait a small amount of time before pointerup
      await this.delay(10);

      // Trigger pointerup
      this.pointerUp(position);

      // If there are more taps to perform, wait for the delay
      if (i < taps - 1) {
        await this.delay(tapDelay);
      }
    }
  }
}

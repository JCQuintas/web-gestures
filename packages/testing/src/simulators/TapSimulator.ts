/**
 * Simulates a tap gesture for testing tap interactions.
 */
import { GestureSimulator } from '../GestureSimulator';
import { TapSimulatorOptions } from '../types';

export class TapSimulator extends GestureSimulator {
  private options: TapSimulatorOptions;

  constructor(options: TapSimulatorOptions) {
    super(options);
    this.options = options;
  }

  /**
   * Simulates a single tap.
   */
  private async simulateSingleTap(): Promise<void> {
    const { position } = this.options;

    // Quick tap is just a pointerdown followed immediately by a pointerup
    this.pointerDown(position);

    // Small delay to make it feel like a real tap (roughly 50ms)
    await this.delay(50);

    this.pointerUp(position);
  }

  /**
   * Simulates a tap gesture with the specified number of taps.
   */
  public async simulateTap(): Promise<void> {
    const { taps = 1, delay = 100 } = this.options;

    for (let i = 0; i < taps; i++) {
      await this.simulateSingleTap();

      // Add delay between taps if there are more taps to come
      if (i < taps - 1) {
        await this.delay(delay);
      }
    }
  }
}

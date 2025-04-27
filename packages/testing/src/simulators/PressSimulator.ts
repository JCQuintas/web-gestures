/**
 * Simulates a press gesture for testing.
 */
import { PointerGestureSimulator } from '../PointerGestureSimulator';
import { PressSimulatorOptions } from '../types';

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

    // Trigger pointerdown at the position
    this.pointerDown(position);

    // Wait for the specified duration
    await this.delay(duration);

    // Trigger pointerup if not skipped
    if (!skipPointerUp) {
      this.pointerUp(position);
    }
  }
}

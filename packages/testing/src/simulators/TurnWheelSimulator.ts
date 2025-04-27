/**
 * Simulates a turn wheel (scroll) gesture for testing.
 */
import { PointerGestureSimulator } from '../PointerGestureSimulator';
import { TurnWheelSimulatorOptions } from '../types';

export class TurnWheelSimulator extends PointerGestureSimulator {
  private options: TurnWheelSimulatorOptions;

  constructor(options: TurnWheelSimulatorOptions) {
    super(options);
    this.options = options;
  }

  /**
   * Simulates a wheel event at the specified position.
   */
  public async simulateTurnWheel(): Promise<void> {
    const {
      position,
      deltaX = 0,
      deltaY = 100,
      deltaZ = 0,
      steps = 1,
      stepDelay = 50,
    } = this.options;

    // Move pointer to position first
    this.dispatchPointerEvent('pointermove', position);

    // Dispatch wheel events
    for (let i = 0; i < steps; i++) {
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: position.x,
        clientY: position.y,
        deltaX,
        deltaY,
        deltaZ,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
      });

      this.element.dispatchEvent(wheelEvent);

      if (i < steps - 1) {
        await this.delay(stepDelay);
      }
    }
  }
}

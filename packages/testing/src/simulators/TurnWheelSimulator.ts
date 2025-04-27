/**
 * Simulates a wheel/scroll gesture for testing wheel interactions.
 */
import { GestureSimulator } from '../GestureSimulator';
import { TurnWheelSimulatorOptions } from '../types';

export class TurnWheelSimulator extends GestureSimulator {
  private options: TurnWheelSimulatorOptions;

  constructor(options: TurnWheelSimulatorOptions) {
    super(options);
    this.options = options;
  }

  /**
   * Creates a wheel event with the specified configuration.
   */
  private createWheelEvent(
    deltaX = 0,
    deltaY = 0,
    deltaZ = 0,
    options: Partial<WheelEventInit> = {}
  ): WheelEvent {
    const rect = this.element.getBoundingClientRect();
    const clientX = this.options.position.x + rect.left;
    const clientY = this.options.position.y + rect.top;

    const defaults: WheelEventInit = {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      screenX: clientX,
      screenY: clientY,
      view: window,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
      deltaX,
      deltaY,
      deltaZ,
      ...options,
    };

    return new WheelEvent('wheel', defaults);
  }

  /**
   * Simulates a wheel/scroll gesture.
   */
  public async simulateWheel(): Promise<void> {
    const {
      position,
      deltaX = 0,
      deltaY = 100,
      deltaZ = 0,
      steps = 1,
      stepDelay = 50,
    } = this.options;

    // Generate initial mouseenter and mousemove events to simulate
    // user hovering over the element before scrolling
    if (!this.options.skipPointerDown) {
      this.dispatchPointerEvent('pointerenter', position);
      this.dispatchPointerEvent('pointermove', position);
    }

    // Dispatch wheel events
    for (let i = 0; i < steps; i++) {
      // Calculate delta proportions for smoother multi-step scrolling if needed
      const stepDeltaX = deltaX / steps;
      const stepDeltaY = deltaY / steps;
      const stepDeltaZ = deltaZ / steps;

      // Create and dispatch the wheel event
      const wheelEvent = this.createWheelEvent(stepDeltaX, stepDeltaY, stepDeltaZ);
      this.element.dispatchEvent(wheelEvent);

      // Delay between wheel events if there are more steps
      if (i < steps - 1) {
        await this.delay(stepDelay);
      }
    }

    // Generate pointerleave if not skipped
    if (!this.options.skipPointerUp) {
      this.dispatchPointerEvent('pointerleave', position);
    }
  }
}

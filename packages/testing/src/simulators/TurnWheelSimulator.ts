/**
 * Simulates a turn wheel (scroll) gesture for testing.
 */
import { GestureSimulator, GestureSimulatorOptions } from '../GestureSimulator';
import { Point } from '../types';

/**
 * Options for a wheel/scroll gesture simulation.
 */
export interface TurnWheelSimulatorOptions extends GestureSimulatorOptions {
  /**
   * Position where the wheel event should occur.
   */
  position: Point;

  /**
   * Skips the pointermove event before the wheel event.
   * This is useful when you want to simulate a wheel event without moving the pointer.
   * @default false
   */
  skipPointerMove?: boolean;

  /**
   * Delta X value for horizontal scrolling.
   * @default 0
   */
  deltaX?: number;

  /**
   * Delta Y value for vertical scrolling.
   * @default 100
   */
  deltaY?: number;

  /**
   * Delta Z value for 3D scrolling.
   * @default 0
   */
  deltaZ?: number;

  /**
   * Number of wheel events to dispatch.
   * @default 1
   */
  steps?: number;

  /**
   * Delay between wheel events in milliseconds.
   * @default 50
   */
  stepDelay?: number;
}

export class TurnWheelSimulator extends GestureSimulator {
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
      skipPointerMove = false,
    } = this.options;

    if (!skipPointerMove) {
      // Move pointer to position first
      const rect = this.element.getBoundingClientRect();
      const clientX = position.x + rect.left;
      const clientY = position.y + rect.top;

      const moveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse',
        pointerId: 1,
        clientX,
        clientY,
        screenX: clientX,
        screenY: clientY,
        view: window,
      });

      this.element.dispatchEvent(moveEvent);
    }

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

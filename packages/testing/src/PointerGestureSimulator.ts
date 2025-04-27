/**
 * Simulator for pointer-based gestures (mouse, touch, pen).
 * Extends the base GestureSimulator with pointer-specific event handling.
 */
import { GestureSimulator } from './GestureSimulator';
import { PointerManager } from './PointerManager';
import { BaseSimulatorOptions, Point } from './types';

export class PointerGestureSimulator extends GestureSimulator {
  protected pointerType: string;
  protected pointerId: number;
  protected pointerDownTime: number;
  protected pointerManager: PointerManager;

  constructor(options: BaseSimulatorOptions) {
    super(options);
    this.pointerType = options.pointerType || 'mouse';
    this.pointerManager = PointerManager.getInstance();
    // Get a unique pointer ID from the PointerManager
    this.pointerId = this.pointerManager.generatePointerId();
    this.pointerDownTime = 0;
  }

  /**
   * Creates a pointer event with the specified configuration.
   */
  private createPointerEvent(
    type: string,
    position: Point,
    options: Partial<PointerEventInit> = {},
    pointerId?: number
  ): PointerEvent {
    const rect = this.element.getBoundingClientRect();
    const clientX = position.x + rect.left;
    const clientY = position.y + rect.top;

    const defaults: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      pointerType: this.pointerType,
      pointerId: pointerId ?? this.pointerId,
      clientX,
      clientY,
      screenX: clientX,
      screenY: clientY,
      view: window,
      isPrimary: pointerId ? false : true,
      ...options,
    };

    // Set button and buttons properties based on the event type
    if (type === 'pointerdown' || type === 'mousedown' || type.includes('start')) {
      defaults.button = 0;
      defaults.buttons = 1;
    }

    return new PointerEvent(type, defaults);
  }

  /**
   * Dispatches a pointer event on the target element.
   */
  protected dispatchPointerEvent(
    type: string,
    position: Point,
    options: Partial<PointerEventInit> = {},
    pointerId?: number
  ): PointerEvent {
    const event = this.createPointerEvent(type, position, options, pointerId);
    this.element.dispatchEvent(event);
    return event;
  }

  /**
   * Dispatches a pointerdown event on the target element.
   */
  protected pointerDown(
    position: Point,
    options: Partial<PointerEventInit> = {},
    pointerId?: number
  ): PointerEvent {
    this.pointerDownTime = Date.now();
    return this.dispatchPointerEvent('pointerdown', position, options, pointerId);
  }

  /**
   * Dispatches a pointermove event on the target element.
   */
  protected pointerMove(
    position: Point,
    options: Partial<PointerEventInit> = {},
    pointerId?: number
  ): PointerEvent {
    return this.dispatchPointerEvent('pointermove', position, options, pointerId);
  }

  /**
   * Dispatches a pointerup event on the target element.
   */
  protected pointerUp(
    position: Point,
    options: Partial<PointerEventInit> = {},
    pointerId?: number
  ): PointerEvent {
    const event = this.dispatchPointerEvent(
      'pointerup',
      position,
      {
        button: 0,
        buttons: 0,
        ...options,
      },
      pointerId
    );

    // Release the pointer ID after pointerup
    this.pointerManager.releasePointerId(pointerId ?? this.pointerId);

    return event;
  }

  /**
   * Dispatches a pointercancel event on the target element.
   */
  protected pointerCancel(
    position: Point,
    options: Partial<PointerEventInit> = {},
    pointerId?: number
  ): PointerEvent {
    const event = this.dispatchPointerEvent('pointercancel', position, options, pointerId);

    // Release the pointer ID after pointercancel
    this.pointerManager.releasePointerId(pointerId ?? this.pointerId);

    return event;
  }
}

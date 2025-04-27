import { Point } from './types';

/**
 * Pointer class to simulate pointer events on a target element.
 *
 * This class provides methods to dispatch pointer events such as pointerdown,
 * pointermove, and pointerup. It can be used to simulate user interactions
 * with touch, mouse, or pen input.
 */
export class Pointer {
  private element: HTMLElement | SVGElement;
  private pointerType: 'mouse' | 'touch' | 'pen';
  private pointerId: number;

  constructor(
    element: HTMLElement | SVGElement,
    pointerType: 'mouse' | 'touch' | 'pen' = 'mouse',
    pointerId: number = 1
  ) {
    this.element = element;
    this.pointerType = pointerType;
    this.pointerId = pointerId;
  }

  /**
   * Dispatches a pointer event on the target element.
   */
  public dispatchPointerEvent(
    type: string,
    position: Point,
    options: Partial<PointerEventInit> = {}
  ): PointerEvent {
    const rect = this.element.getBoundingClientRect();
    const clientX = position.x + rect.left;
    const clientY = position.y + rect.top;

    const defaults: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      pointerType: this.pointerType,
      pointerId: this.pointerId,
      clientX,
      clientY,
      screenX: clientX,
      screenY: clientY,
      view: window,
      ...options,
    };

    const event = new PointerEvent(type, defaults);
    this.element.dispatchEvent(event);
    return event;
  }

  /**
   * Dispatches a pointerdown event on the target element.
   */
  public pointerDown(position: Point, options: Partial<PointerEventInit> = {}): PointerEvent {
    return this.dispatchPointerEvent('pointerdown', position, {
      button: 0,
      buttons: 1,
      ...options,
    });
  }

  /**
   * Dispatches a pointermove event on the target element.
   */
  public pointerMove(position: Point, options: Partial<PointerEventInit> = {}): PointerEvent {
    return this.dispatchPointerEvent('pointermove', position, options);
  }

  /**
   * Dispatches a pointerup event on the target element.
   */
  public pointerUp(position: Point, options: Partial<PointerEventInit> = {}): PointerEvent {
    return this.dispatchPointerEvent('pointerup', position, {
      button: 0,
      buttons: 0,
      ...options,
    });
  }
}

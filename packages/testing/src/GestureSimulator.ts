/**
 * Base class for simulating gestures in a testing environment.
 * Provides common utilities to create and dispatch pointer events.
 */
import { BaseSimulatorOptions, Point } from './types';

export class GestureSimulator {
  protected element: HTMLElement | SVGElement;
  protected pointerType: string;
  protected pointerId: number;
  protected pointerDownTime: number;

  constructor(options: BaseSimulatorOptions) {
    this.element = options.element;
    this.pointerType = options.pointerType || 'mouse';
    // Create a random pointer ID to avoid conflicts in multi-pointer scenarios
    this.pointerId = Math.floor(Math.random() * 10000);
    this.pointerDownTime = 0;
  }

  /**
   * Creates a pointer event with the specified configuration.
   */
  protected createPointerEvent(
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
      isPrimary: true,
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
    options: Partial<PointerEventInit> = {}
  ): PointerEvent {
    const event = this.createPointerEvent(type, position, options);
    this.element.dispatchEvent(event);
    return event;
  }

  /**
   * Dispatches a pointerdown event on the target element.
   */
  protected pointerDown(position: Point, options: Partial<PointerEventInit> = {}): PointerEvent {
    this.pointerDownTime = Date.now();
    return this.dispatchPointerEvent('pointerdown', position, options);
  }

  /**
   * Dispatches a pointermove event on the target element.
   */
  protected pointerMove(position: Point, options: Partial<PointerEventInit> = {}): PointerEvent {
    return this.dispatchPointerEvent('pointermove', position, options);
  }

  /**
   * Dispatches a pointerup event on the target element.
   */
  protected pointerUp(position: Point, options: Partial<PointerEventInit> = {}): PointerEvent {
    return this.dispatchPointerEvent('pointerup', position, {
      button: 0,
      buttons: 0,
      ...options,
    });
  }

  /**
   * Delays execution for the specified time.
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Linearly interpolates between two points.
   */
  protected lerp(start: Point, end: Point, t: number): Point {
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };
  }

  /**
   * Generates points along a line from start to end.
   */
  protected generatePoints(start: Point, end: Point, steps: number): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push(this.lerp(start, end, t));
    }
    return points;
  }
}

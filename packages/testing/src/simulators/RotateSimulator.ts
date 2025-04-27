/**
 * Simulates a rotate gesture for testing.
 */
import { PointerGestureSimulator } from '../PointerGestureSimulator';
import { RotateSimulatorOptions, Point } from '../types';

export class RotateSimulator extends PointerGestureSimulator {
  private options: RotateSimulatorOptions;
  private secondPointerId: number;

  constructor(options: RotateSimulatorOptions) {
    super(options);
    this.options = options;
    // Create a second random pointer ID for multi-touch
    this.secondPointerId = Math.floor(Math.random() * 10000) + 10000;
  }

  /**
   * Calculates a point at a given angle and radius from a center point.
   */
  private getPointAtAngle(center: Point, angle: number, radius: number): Point {
    const radians = (angle * Math.PI) / 180;
    return {
      x: center.x + radius * Math.cos(radians),
      y: center.y + radius * Math.sin(radians),
    };
  }

  /**
   * Dispatches a pointer event for the second finger.
   */
  private dispatchSecondPointerEvent(
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
      pointerId: this.secondPointerId,
      clientX,
      clientY,
      screenX: clientX,
      screenY: clientY,
      view: window,
      isPrimary: false,
      ...options,
    };

    // Set button and buttons properties based on the event type
    if (type === 'pointerdown' || type === 'mousedown' || type.includes('start')) {
      defaults.button = 0;
      defaults.buttons = 1;
    }

    const event = new PointerEvent(type, defaults);
    this.element.dispatchEvent(event);
    return event;
  }

  /**
   * Simulates a rotate gesture.
   */
  public async simulateRotate(): Promise<void> {
    const {
      center,
      radius = 50,
      startAngle = 0,
      endAngle = 90,
      steps = 10,
      duration = 300,
      skipPointerDown = false,
      skipPointerUp = false,
    } = this.options;

    // Calculate delay between steps
    const stepDelay = duration / steps;

    // Calculate angle increment per step
    const angleIncrement = (endAngle - startAngle) / steps;

    // Calculate start positions for the two touch points
    const firstTouchStart = this.getPointAtAngle(center, startAngle, radius);
    const secondTouchStart = this.getPointAtAngle(center, startAngle + 180, radius);

    // Start the gesture with pointerdown events
    if (!skipPointerDown) {
      this.dispatchPointerEvent('pointerdown', firstTouchStart);
      this.dispatchSecondPointerEvent('pointerdown', secondTouchStart);
    }

    // Perform the rotation
    for (let i = 1; i <= steps; i++) {
      await this.delay(stepDelay);
      
      const currentAngle = startAngle + angleIncrement * i;
      const firstTouchPoint = this.getPointAtAngle(center, currentAngle, radius);
      const secondTouchPoint = this.getPointAtAngle(center, currentAngle + 180, radius);
      
      this.dispatchPointerEvent('pointermove', firstTouchPoint);
      this.dispatchSecondPointerEvent('pointermove', secondTouchPoint);
    }

    // End the gesture with pointerup events
    if (!skipPointerUp) {
      const firstTouchEnd = this.getPointAtAngle(center, endAngle, radius);
      const secondTouchEnd = this.getPointAtAngle(center, endAngle + 180, radius);
      
      this.dispatchPointerEvent('pointerup', firstTouchEnd, { button: 0, buttons: 0 });
      this.dispatchSecondPointerEvent('pointerup', secondTouchEnd, { button: 0, buttons: 0 });
    }
  }
}

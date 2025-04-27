/**
 * Simulates a pinch gesture for testing.
 */
import { PointerGestureSimulator } from '../PointerGestureSimulator';
import { PinchSimulatorOptions, Point } from '../types';

export class PinchSimulator extends PointerGestureSimulator {
  private options: PinchSimulatorOptions;
  private secondPointerId: number;

  constructor(options: PinchSimulatorOptions) {
    super(options);
    this.options = options;
    // Create a second random pointer ID for multi-touch
    this.secondPointerId = Math.floor(Math.random() * 10000) + 10000;
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
   * Gets the positions of two points at a given distance from a center point.
   */
  private getPointsAtDistance(center: Point, distance: number): [Point, Point] {
    const halfDistance = distance / 2;
    return [
      { x: center.x - halfDistance, y: center.y },
      { x: center.x + halfDistance, y: center.y },
    ];
  }

  /**
   * Simulates a pinch gesture.
   */
  public async simulatePinch(): Promise<void> {
    const {
      center,
      startDistance,
      endDistance,
      steps = 10,
      duration = 300,
      skipPointerDown = false,
      skipPointerUp = false,
    } = this.options;

    // Calculate delay between steps
    const stepDelay = duration / steps;

    // Calculate distance increment per step
    const distanceIncrement = (endDistance - startDistance) / steps;

    // Calculate start positions for the two touch points
    const [firstTouchStart, secondTouchStart] = this.getPointsAtDistance(center, startDistance);

    // Start the gesture with pointerdown events
    if (!skipPointerDown) {
      this.dispatchPointerEvent('pointerdown', firstTouchStart);
      this.dispatchSecondPointerEvent('pointerdown', secondTouchStart);
    }

    // Perform the pinch
    for (let i = 1; i <= steps; i++) {
      await this.delay(stepDelay);
      
      const currentDistance = startDistance + distanceIncrement * i;
      const [firstTouchPoint, secondTouchPoint] = this.getPointsAtDistance(center, currentDistance);
      
      this.dispatchPointerEvent('pointermove', firstTouchPoint);
      this.dispatchSecondPointerEvent('pointermove', secondTouchPoint);
    }

    // End the gesture with pointerup events
    if (!skipPointerUp) {
      const [firstTouchEnd, secondTouchEnd] = this.getPointsAtDistance(center, endDistance);
      
      this.dispatchPointerEvent('pointerup', firstTouchEnd, { button: 0, buttons: 0 });
      this.dispatchSecondPointerEvent('pointerup', secondTouchEnd, { button: 0, buttons: 0 });
    }
  }
}

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
    this.secondPointerId = this.pointerIdManager.generatePointerId();
  }

  /**
   * Calculates points for a pinch gesture at a given distance from center.
   */
  private getPinchPoints(center: Point, distance: number): [Point, Point] {
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

    // Calculate start positions
    const [firstTouchStart, secondTouchStart] = this.getPinchPoints(center, startDistance);

    // Start the gesture with pointerdown events
    if (!skipPointerDown) {
      this.pointerDown(firstTouchStart);
      this.pointerDown(secondTouchStart, {}, this.secondPointerId);
    }

    // Perform the pinch
    for (let i = 1; i <= steps; i++) {
      await this.delay(stepDelay);

      const currentDistance = startDistance + distanceIncrement * i;
      const [firstTouchPoint, secondTouchPoint] = this.getPinchPoints(center, currentDistance);

      this.pointerMove(firstTouchPoint);
      this.pointerMove(secondTouchPoint, {}, this.secondPointerId);
    }

    // End the gesture with pointerup events
    if (!skipPointerUp) {
      const [firstTouchEnd, secondTouchEnd] = this.getPinchPoints(center, endDistance);

      this.pointerUp(firstTouchEnd);
      this.pointerUp(secondTouchEnd, {}, this.secondPointerId);
    }
  }
}

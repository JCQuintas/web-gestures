/**
 * Simulates a pinch gesture for testing pinch/zoom interactions.
 */
import { GestureSimulator } from '../GestureSimulator';
import { PinchSimulatorOptions, Point } from '../types';

export class PinchSimulator extends GestureSimulator {
  private options: PinchSimulatorOptions;
  private secondaryPointerId: number;

  constructor(options: PinchSimulatorOptions) {
    super(options);
    this.options = options;
    // Create a different pointer ID for the second touch point
    this.secondaryPointerId = this.pointerId + 1;
  }

  /**
   * Calculate two points at a given distance from the center
   */
  private getPointsAtDistance(center: Point, distance: number): [Point, Point] {
    const halfDistance = distance / 2;
    return [
      { x: center.x - halfDistance, y: center.y },
      { x: center.x + halfDistance, y: center.y },
    ];
  }

  /**
   * Simulate a pinch gesture (pinch in or out)
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

    // Generate intermediate distances
    const distances: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      distances.push(startDistance + (endDistance - startDistance) * t);
    }

    // Get initial points
    const [point1Start, point2Start] = this.getPointsAtDistance(center, startDistance);

    // Trigger pointerdown events
    if (!skipPointerDown) {
      this.pointerDown(point1Start);
      this.dispatchPointerEvent('pointerdown', point2Start, {
        pointerId: this.secondaryPointerId,
        isPrimary: false,
      });
    }

    // Move through intermediate points
    for (let i = 1; i <= steps; i++) {
      await this.delay(stepDelay);
      const [point1, point2] = this.getPointsAtDistance(center, distances[i]);

      // Move both pointers
      this.pointerMove(point1);
      this.dispatchPointerEvent('pointermove', point2, {
        pointerId: this.secondaryPointerId,
        isPrimary: false,
      });
    }

    // Get final points
    const [point1End, point2End] = this.getPointsAtDistance(center, endDistance);

    // Trigger pointerup events
    if (!skipPointerUp) {
      await this.delay(stepDelay);
      this.pointerUp(point1End);
      this.dispatchPointerEvent('pointerup', point2End, {
        pointerId: this.secondaryPointerId,
        isPrimary: false,
        button: 0,
        buttons: 0,
      });
    }
  }
}

/**
 * Simulates a rotate gesture for testing.
 */
import { PointerGestureSimulator } from '../PointerGestureSimulator';
import { Point, RotateSimulatorOptions } from '../types';

export class RotateSimulator extends PointerGestureSimulator {
  private options: RotateSimulatorOptions;
  private secondPointerId: number;

  constructor(options: RotateSimulatorOptions) {
    super(options);
    this.options = options;
    // Create a second random pointer ID for multi-touch
    this.secondPointerId = this.pointerManager.generatePointerId();
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
      this.pointerDown(firstTouchStart);
      this.pointerDown(secondTouchStart, {}, this.secondPointerId);
    }

    // Perform the rotation
    for (let i = 1; i <= steps; i++) {
      await this.delay(stepDelay);

      const currentAngle = startAngle + angleIncrement * i;
      const firstTouchPoint = this.getPointAtAngle(center, currentAngle, radius);
      const secondTouchPoint = this.getPointAtAngle(center, currentAngle + 180, radius);

      this.pointerMove(firstTouchPoint);
      this.pointerMove(secondTouchPoint, {}, this.secondPointerId);
    }

    // End the gesture with pointerup events
    if (!skipPointerUp) {
      const firstTouchEnd = this.getPointAtAngle(center, endAngle, radius);
      const secondTouchEnd = this.getPointAtAngle(center, endAngle + 180, radius);

      this.pointerUp(firstTouchEnd, { button: 0, buttons: 0 });
      this.pointerUp(secondTouchEnd, { button: 0, buttons: 0 }, this.secondPointerId);
    }
  }
}

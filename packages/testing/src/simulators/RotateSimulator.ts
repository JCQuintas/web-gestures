/**
 * Simulates a rotate gesture for testing rotation interactions.
 */
import { GestureSimulator } from '../GestureSimulator';
import { Point, RotateSimulatorOptions } from '../types';

export class RotateSimulator extends GestureSimulator {
  private options: RotateSimulatorOptions;
  private secondaryPointerId: number;

  constructor(options: RotateSimulatorOptions) {
    super(options);
    this.options = options;
    // Create a different pointer ID for the second touch point
    this.secondaryPointerId = this.pointerId + 1;
  }

  /**
   * Calculate a point at a given angle and radius from the center
   */
  private pointOnCircle(center: Point, radius: number, angleDegrees: number): Point {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    return {
      x: center.x + radius * Math.cos(angleRadians),
      y: center.y + radius * Math.sin(angleRadians),
    };
  }

  /**
   * Calculate two points opposite each other at given angles
   */
  private getPointsAtAngle(
    center: Point,
    radius: number,
    angle1Degrees: number,
    angle2Degrees: number
  ): [Point, Point] {
    return [
      this.pointOnCircle(center, radius, angle1Degrees),
      this.pointOnCircle(center, radius, angle2Degrees),
    ];
  }

  /**
   * Simulate a rotation gesture
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

    // Generate intermediate angles
    const angles: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      angles.push(startAngle + (endAngle - startAngle) * t);
    }

    // Pointer 2 is 180 degrees opposite from pointer 1
    const getSecondAngle = (angle: number) => (angle + 180) % 360;

    // Get initial points
    const [point1Start, point2Start] = this.getPointsAtAngle(
      center,
      radius,
      startAngle,
      getSecondAngle(startAngle)
    );

    // Trigger pointerdown events
    if (!skipPointerDown) {
      this.pointerDown(point1Start);
      this.dispatchPointerEvent('pointerdown', point2Start, {
        pointerId: this.secondaryPointerId,
        isPrimary: false,
      });
    }

    // Move through intermediate angles
    for (let i = 1; i <= steps; i++) {
      await this.delay(stepDelay);
      const [point1, point2] = this.getPointsAtAngle(
        center,
        radius,
        angles[i],
        getSecondAngle(angles[i])
      );

      // Move both pointers
      this.pointerMove(point1);
      this.dispatchPointerEvent('pointermove', point2, {
        pointerId: this.secondaryPointerId,
        isPrimary: false,
      });
    }

    // Get final points
    const [point1End, point2End] = this.getPointsAtAngle(
      center,
      radius,
      endAngle,
      getSecondAngle(endAngle)
    );

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

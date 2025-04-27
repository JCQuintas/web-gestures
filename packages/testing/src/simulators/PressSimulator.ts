/**
 * Simulates a press gesture for testing press interactions.
 */
import { GestureSimulator } from '../GestureSimulator';
import { PressSimulatorOptions } from '../types';

export class PressSimulator extends GestureSimulator {
  private options: PressSimulatorOptions;
  
  constructor(options: PressSimulatorOptions) {
    super(options);
    this.options = options;
  }
  
  /**
   * Simulates a press gesture at the specified position for the specified duration.
   */
  public async simulatePress(): Promise<void> {
    const { 
      position, 
      duration = 500,
      skipPointerDown = false,
      skipPointerUp = false 
    } = this.options;
    
    // Trigger pointerdown
    if (!skipPointerDown) {
      this.pointerDown(position);
    }
    
    // Hold for the duration
    await this.delay(duration);
    
    // Trigger pointerup
    if (!skipPointerUp) {
      this.pointerUp(position);
    }
  }
}
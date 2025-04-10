/**
 * PointerManager - Centralized manager for all pointer events
 *
 * This class handles all pointer events and distributes them to registered gesture handlers
 */

export type PointerData = {
  pointerId: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  target: EventTarget | null;
  timeStamp: number;
  type: string;
  isPrimary: boolean;
  pressure: number;
  width: number;
  height: number;
  pointerType: string;
  srcEvent: PointerEvent;
};

export type PointerManagerOptions = {
  root: HTMLElement;
  touchAction?: string;
  passive?: boolean;
};

export class PointerManager {
  private static instance: PointerManager | null = null;

  private root: HTMLElement;
  private touchAction: string;
  private passive: boolean;
  private pointers: Map<number, PointerData> = new Map();
  private gestureHandlers: Set<(pointers: Map<number, PointerData>, event: PointerEvent) => void> =
    new Set();

  private constructor(options: PointerManagerOptions) {
    this.root = options.root;
    this.touchAction = options.touchAction || 'auto';
    this.passive = options.passive !== false;

    this.setupEventListeners();
  }

  /**
   * Get singleton instance of PointerManager
   */
  public static getInstance(options?: PointerManagerOptions): PointerManager {
    if (!PointerManager.instance && options) {
      PointerManager.instance = new PointerManager(options);
    } else if (!PointerManager.instance && !options) {
      throw new Error('PointerManager must be initialized with options first time');
    }

    return PointerManager.instance!;
  }

  /**
   * Register a gesture handler to receive pointer events
   */
  public registerGestureHandler(
    handler: (pointers: Map<number, PointerData>, event: PointerEvent) => void
  ): () => void {
    this.gestureHandlers.add(handler);

    // Return unregister function
    return () => {
      this.gestureHandlers.delete(handler);
    };
  }

  /**
   * Get all active pointers
   */
  public getPointers(): Map<number, PointerData> {
    return new Map(this.pointers);
  }

  /**
   * Setup event listeners for pointer events
   */
  private setupEventListeners(): void {
    // Set touch-action CSS property
    if (this.touchAction !== 'auto') {
      this.root.style.touchAction = this.touchAction;
    }

    // Add event listeners
    this.root.addEventListener('pointerdown', this.handlePointerEvent, { passive: this.passive });
    window.addEventListener('pointermove', this.handlePointerEvent, { passive: this.passive });
    window.addEventListener('pointerup', this.handlePointerEvent, { passive: this.passive });
    window.addEventListener('pointercancel', this.handlePointerEvent, { passive: this.passive });
  }

  /**
   * Handle all pointer events
   */
  private handlePointerEvent = (event: PointerEvent): void => {
    const { type, pointerId } = event;

    // Create or update pointer data
    if (type === 'pointerdown') {
      this.pointers.set(pointerId, this.createPointerData(event));
      // Capture the pointer to track it even when it leaves the element
      if (event.target instanceof Element) {
        event.target.setPointerCapture(pointerId);
      }
    } else if (type === 'pointermove') {
      this.pointers.set(pointerId, this.createPointerData(event));
    }
    // Remove pointer data on up or cancel
    else if (type === 'pointerup' || type === 'pointercancel') {
      // Release pointer capture on up or cancel
      if (event.target instanceof Element) {
        event.target.releasePointerCapture(pointerId);
      }

      // Update one last time before removing
      this.pointers.set(pointerId, this.createPointerData(event));

      // Notify handlers with current state
      this.notifyHandlers(event);

      // Then remove the pointer
      this.pointers.delete(pointerId);
      return;
    }

    this.notifyHandlers(event);
  };

  /**
   * Notify all registered gesture handlers
   */
  private notifyHandlers(event: PointerEvent): void {
    this.gestureHandlers.forEach(handler => handler(this.pointers, event));
  }

  /**
   * Create a standardized pointer data object from a PointerEvent
   */
  private createPointerData(event: PointerEvent): PointerData {
    return {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      target: event.target,
      timeStamp: event.timeStamp,
      type: event.type,
      isPrimary: event.isPrimary,
      pressure: event.pressure,
      width: event.width,
      height: event.height,
      pointerType: event.pointerType,
      srcEvent: event,
    };
  }

  /**
   * Clean up all event listeners
   */
  public destroy(): void {
    this.root.removeEventListener('pointerdown', this.handlePointerEvent);
    window.removeEventListener('pointermove', this.handlePointerEvent);
    window.removeEventListener('pointerup', this.handlePointerEvent);
    window.removeEventListener('pointercancel', this.handlePointerEvent);

    this.pointers.clear();
    this.gestureHandlers.clear();
    PointerManager.instance = null;
  }
}

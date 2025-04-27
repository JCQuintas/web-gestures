/**
 * PointerManager for testing package - Manages pointer IDs to ensure they are unique across simulations
 *
 * This singleton class:
 * 1. Generates unique pointer IDs to avoid conflicts in multi-pointer test scenarios
 * 2. Tracks active pointer IDs to prevent reuse
 * 3. Simulates the same functionality as the core PointerManager but for testing purposes
 */

/**
 * Manages the generation and tracking of pointer IDs for gesture simulations
 */
export class PointerManager {
  /** Singleton instance reference */
  private static instance: PointerManager | null = null;

  /** Set of pointer IDs currently in use */
  private activePointerIds: Set<number> = new Set();

  /** Counter for generating sequential IDs when needed */
  private idCounter: number = 5000; // Start at 5000 to avoid potential conflicts

  /**
   * Private constructor enforces singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of PointerManager
   *
   * @returns The singleton PointerManager instance
   */
  public static getInstance(): PointerManager {
    if (!PointerManager.instance) {
      PointerManager.instance = new PointerManager();
    }

    return PointerManager.instance;
  }

  /**
   * Generate a new, unused pointer ID
   *
   * @returns A unique pointer ID that is not currently in use
   */
  public generatePointerId(): number {
    const pointerId = this.idCounter++;
    this.activePointerIds.add(pointerId);
    return pointerId;
  }

  /**
   * Release a pointer ID when it's no longer in use
   *
   * @param pointerId The pointer ID to release
   */
  public releasePointerId(pointerId: number): void {
    this.activePointerIds.delete(pointerId);
  }

  /**
   * Check if a pointer ID is currently in use
   *
   * @param pointerId The pointer ID to check
   * @returns True if the pointer ID is in use, false otherwise
   */
  public isPointerIdActive(pointerId: number): boolean {
    return this.activePointerIds.has(pointerId);
  }

  /**
   * Reset the PointerManager, releasing all pointer IDs
   * Useful for cleanup between test runs
   */
  public reset(): void {
    this.activePointerIds.clear();
  }
}

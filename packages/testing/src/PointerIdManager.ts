/**
 * Manages the generation of pointer IDs for gesture simulations
 */
export class PointerIdManager {
  /** Singleton instance reference */
  private static instance: PointerIdManager | null = null;

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
  public static getInstance(): PointerIdManager {
    if (!PointerIdManager.instance) {
      PointerIdManager.instance = new PointerIdManager();
    }

    return PointerIdManager.instance;
  }

  /**
   * Generate a new, unused pointer ID
   *
   * @returns A unique pointer ID that is not currently in use
   */
  public generatePointerId(): number {
    return this.idCounter++;
  }
}

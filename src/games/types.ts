/**
 * Represents the state of any game. 
 * Specific games will extend this or use properties dynamically.
 */
export type GameState = Record<string, unknown>;

/**
 * Defines the interface for any Canvas game module.
 */
export type Game = {
  /** Unique identifier for the game (e.g., 'brick-breaker') */
  id: string;
  /** Display name of the game */
  name: string;
  /** Brief description */
  description: string;
  /** Type is always canvas now */
  type: 'canvas';

  // Removed ASCII-specific methods: init, render, update, isOver, gameOverText
  // TODO: Define required methods for canvas games (e.g., initializeEngine, destroyEngine?)
  // These will likely be called by the GameCanvas component.
  // Placeholder for potential future requirements
  [key: string]: any; // Allow other properties for now
}; 
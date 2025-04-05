/**
 * Represents the state of any game. 
 * Specific games will extend this or use properties dynamically.
 */
export type GameState = Record<string, unknown>;

/**
 * Defines the interface for any ASCII game module.
 */
export type Game = {
  /** Unique identifier for the game (e.g., 'pong') */
  id: string;
  /** Display name of the game */
  name: string;
  /** Brief description */
  description: string;
  /** Initializes the game state */
  init: () => GameState;
  /** Renders the current game state as an array of strings (terminal lines) */
  render: (state: GameState) => string[];
  /** Processes a single key input and returns the new game state */
  update: (state: GameState, key?: string | null) => GameState;
  /** Checks if the game has ended based on the state */
  isOver: (state: GameState) => boolean;
  /** Provides text to display when the game is over */
  gameOverText: (state: GameState) => string[];
}; 
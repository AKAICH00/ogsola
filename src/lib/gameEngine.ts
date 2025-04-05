// src/lib/gameEngine.ts
// Comment out unused imports
// import type { Game, GameState } from '../games/types';
import { getGame } from '../games';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

// Initialize an empty key state object
export function createEmptyKeyState(): KeyState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
  };
}

// Track key presses (to be used by React component)
export function handleKeyDown(e: KeyboardEvent, keyState: KeyState): KeyState {
  const newState = { ...keyState };
  
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      newState.up = true;
      break;
    case 's':
    case 'arrowdown':
      newState.down = true;
      break;
    case 'a':
    case 'arrowleft':
      newState.left = true;
      break;
    case 'd':
    case 'arrowright':
      newState.right = true;
      break;
    case ' ':
      newState.space = true;
      break;
  }
  
  return newState;
}

// Track key releases
export function handleKeyUp(e: KeyboardEvent, keyState: KeyState): KeyState {
  const newState = { ...keyState };
  
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      newState.up = false;
      break;
    case 's':
    case 'arrowdown':
      newState.down = false;
      break;
    case 'a':
    case 'arrowleft':
      newState.left = false;
      break;
    case 'd':
    case 'arrowright':
      newState.right = false;
      break;
    case ' ':
      newState.space = false;
      break;
  }
  
  return newState;
}

// Update function to handle game state based on user input
// Specify a more specific type instead of any
export function updateGameWithInput(gameState: Record<string, unknown>, keyState: KeyState): Record<string, unknown> {
  // This is a simplified input handler
  // In a real implementation, you would call the game's update function with the appropriate input
  // based on the key state
  
  // Just a placeholder for now
  return gameState;
}

// The run game loop function is mostly retired since we handle the loop in the React component
// but we keep this for potential initialization or other uses
export function runGameLoop(gameId: string, simulatedInputs: string[] = []): string[] {
  const game = getGame(gameId);
  
  if (!game) {
    return [`Game not found: ${gameId}`];
  }
  
  return [`Starting game: ${game.name}`];
} 
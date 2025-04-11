import type { Game } from './types';
// Remove imports for archived ASCII games
// import { PongGame as SolasPongGame } from './solas-pong';
// import { PongGame } from './pong';
// import { AbstractPong } from './abstract-pong';
// import { CryptoTradingSim } from './CryptoTradingSim';
// import { NFTQuest } from './NFTQuest';
// import { BlockchainPuzzle } from './BlockchainPuzzle';
// import { MysticalTradingQuest } from './MysticalTradingQuest';

// TODO: Import Canvas game modules here when created
// Example: import { BrickBreakerGame } from './canvas/brick-breaker';

// Clear the game list, ready for canvas games
export const gameList: Game[] = [
  // TODO: Add canvas game objects here
  // Example: { ...BrickBreakerGame, type: 'canvas' },
];

// Updated helper function - kept for now, but might need adjustment for canvas games
export function getGame(identifier: string): Game | undefined {
  const lowerId = identifier.toLowerCase();
  const index = parseInt(identifier, 10); // Try parsing as a number

  // Check if identifier is a valid number and within the array bounds
  if (!isNaN(index) && index > 0 && index <= gameList.length) {
    return gameList[index - 1]; // Use index - 1 for 0-based array access
  }

  // If not a valid index, try finding by ID string
  return gameList.find(game => game.id.toLowerCase() === lowerId);
} 
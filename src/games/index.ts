import type { Game } from './types';
import { PongGame as SolasPongGame } from './solas-pong';
// Import the new game
import { PongGame } from './pong';
// Import the new abstract pong game
import { AbstractPong } from './abstract-pong';
// Import other games here as they are created
// import { LemmingsGame } from './lemmings';
// Import placeholder games (even if commented out in page.tsx, keep them potentially available)
import { CryptoTradingSim } from './CryptoTradingSim';
import { NFTQuest } from './NFTQuest';
import { BlockchainPuzzle } from './BlockchainPuzzle';
import { MysticalTradingQuest } from './MysticalTradingQuest';
// Comment out unused import
// import { GameBuilderTemplate } from './GameBuilder';

// Registry as an array for indexed access
export const gameList: Game[] = [
  AbstractPong,    // Index 0 (Run with '1')
  PongGame,        // Index 1 (Run with '2')
  SolasPongGame,   // Index 2 (Run with '3')
  // Add placeholders - they won't run correctly but allows lookup
  CryptoTradingSim, // Index 3 (Run with '4')
  NFTQuest,         // Index 4 (Run with '5')
  BlockchainPuzzle, // Index 5 (Run with '6')
  MysticalTradingQuest, // Index 6 (Run with '7')
  // GameBuilderTemplate // Usually not directly runnable
];

// Updated helper function to get a game by its ID string or index number (as string)
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
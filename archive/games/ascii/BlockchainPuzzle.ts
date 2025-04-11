// src/games/BlockchainPuzzle.ts
import type { Game, GameState } from './types';

export interface PuzzleState extends GameState { placeholder?: boolean; }

export const BlockchainPuzzle: Game = {
  id: 'puzzle', name: 'Blockchain Puzzle', description: 'Placeholder',
  init: (): PuzzleState => ({ placeholder: true }),
  render: () => ['Blockchain Puzzle - Placeholder'],
  update: (s) => s,
  isOver: () => true,
  gameOverText: () => ['Placeholder']
}; 
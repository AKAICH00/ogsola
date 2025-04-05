// src/games/GameBuilder.ts
import type { Game, GameState } from './types';

// Placeholder type
export interface CustomGameState extends GameState { placeholder?: boolean; }

// Placeholder game object
export const GameBuilderTemplate: Game = {
  id: 'builder-template', name: 'Builder Template', description: 'Placeholder',
  init: (): CustomGameState => ({ placeholder: true }),
  render: () => ['Game Builder - Placeholder'],
  update: (s) => s,
  isOver: () => true,
  gameOverText: () => ['Placeholder']
};

// Placeholder for user-created games array (can be moved later)
export const userGames: Game[] = []; 
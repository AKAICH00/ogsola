// src/games/MysticalTradingQuest.ts
import type { Game, GameState } from './types';

export interface TradingQuestState extends GameState { placeholder?: boolean; }

export const MysticalTradingQuest: Game = {
  id: 'trading-quest', name: 'Trading Quest', description: 'Placeholder',
  init: (): TradingQuestState => ({ placeholder: true }),
  render: () => ['Mystical Trading Quest - Placeholder'],
  update: (s) => s,
  isOver: () => true,
  gameOverText: () => ['Placeholder']
}; 
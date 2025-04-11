// src/games/CryptoTradingSim.ts
import type { Game, GameState } from './types';

export interface TradingState extends GameState { placeholder?: boolean; }

export const CryptoTradingSim: Game = {
  id: 'crypto-sim', name: 'Crypto Sim', description: 'Placeholder',
  init: (): TradingState => ({ placeholder: true }),
  render: () => ['Crypto Trading Sim - Placeholder'],
  update: (s) => s,
  isOver: () => true,
  gameOverText: () => ['Placeholder']
}; 
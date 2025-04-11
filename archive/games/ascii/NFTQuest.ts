// src/games/NFTQuest.ts
import type { Game, GameState } from './types';

export interface QuestState extends GameState { placeholder?: boolean; }

export const NFTQuest: Game = {
  id: 'nft-quest', name: 'NFT Quest', description: 'Placeholder',
  init: (): QuestState => ({ placeholder: true }),
  render: () => ['NFT Quest - Placeholder'],
  update: (s) => s,
  isOver: () => true,
  gameOverText: () => ['Placeholder']
}; 
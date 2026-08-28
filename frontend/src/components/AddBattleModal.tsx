import { useState } from 'react';
import { GameState } from '../types';
import { useGameStore } from '../context/GameContext';
import { generateId } from '../utils/calculations';
import BattleCalculator from './BattleCalculator';

type Props = { gameState: GameState; onClose: () => void };

export default function AddBattleModal({ gameState, onClose }: Props) {
  return <BattleCalculator gameState={gameState} onClose={onClose} />;
}

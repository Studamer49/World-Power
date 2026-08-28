import { useState } from 'react';
import { GameState } from '../types';
import { useGameStore } from '../context/GameContext';
import { generateNotebookText, formatMP } from '../utils/calculations';

type Props = { gameState: GameState; onClose: () => void };

export default function NotebookMode({ gameState, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const text = generateNotebookText(
    gameState.gameDay,
    gameState.gameDate,
    gameState.countries,
    gameState.allBattles,
    gameState.allExpenses,
    gameState.allMoneyChanges,
    gameState.allMPChanges
  );

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>NOTEBOOK MODE</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>
        <p className="text-muted">Compact daily summary for copying into your physical register.</p>
        <pre className="notebook-output">{text}</pre>
        <div className="center-row">
          <button className="btn btn-accent" onClick={copy}>{copied ? 'COPIED!' : 'COPY TO CLIPBOARD'}</button>
        </div>
      </div>
    </div>
  );
}

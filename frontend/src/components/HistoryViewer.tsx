import { useState } from 'react';
import { GameState } from '../types';
import { useGameStore } from '../context/GameContext';

type Props = { gameState: GameState; onClose: () => void };

export default function HistoryViewer({ gameState, onClose }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const days = Object.keys(gameState.dailySnapshots).map(Number).sort((a, b) => b - a);

  const getCountryName = (id: string) => gameState.countries[id]?.name || '???';

  const snapshots = selectedDay !== null ? (gameState.dailySnapshots[selectedDay] || []) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>GAME HISTORY</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        <div className="history-day-list">
          {days.length === 0 && <div className="empty-state">No daily snapshots yet.</div>}
          {days.map(d => (
            <button key={d} className={`btn btn-sm ${selectedDay === d ? 'btn-active' : ''}`} onClick={() => setSelectedDay(d)}>
              Day {d}
            </button>
          ))}
        </div>

        {selectedDay !== null && (
          <div className="history-day-content">
            <h3>Day {selectedDay}</h3>
            {snapshots.length === 0 && <div className="text-muted">No snapshots for this day.</div>}
            {snapshots.map((snap, i) => (
              <div key={i} className="snapshot-card">
                <h4>{getCountryName(snap.countryId)}</h4>
                <div className="snap-row">Money: {snap.startingMoney} → {snap.endingMoney}</div>
                <div className="snap-row">MP: {snap.startingMP} → {snap.endingMP}</div>
                <div className="snap-row">GDP: {snap.startingGDP} → {snap.endingGDP}</div>
                {snap.moneyChanges.length > 1 && (
                  <div className="snap-changes">
                    {snap.moneyChanges.map((mc, j) => (
                      <div key={j} className="snap-change">{mc.type}: {mc.amount}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="history-section">
          <h3>Battle History ({gameState.allBattles.length})</h3>
          {gameState.allBattles.sort((a, b) => a.day - b.day).map(b => (
            <div key={b.id} className="history-battle-item">
              <span>Day {b.day}</span>
              <span>{getCountryName(b.attackerId)} vs {getCountryName(b.defenderId)}</span>
              <span>{b.target}</span>
              <span>EP: {b.attackerEffectivePower} vs {b.defenderEffectivePower}</span>
              <span className={b.winner === b.attackerId ? 'text-success' : 'text-danger'}>
                Winner: {getCountryName(b.winner)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

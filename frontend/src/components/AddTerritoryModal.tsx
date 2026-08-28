import { useState } from 'react';
import { GameState } from '../types';
import { useGameStore } from '../context/GameContext';
import { generateId } from '../utils/calculations';
import { OCCUPIED_MONEY_INCOME } from '../data/research';

type Props = { gameState: GameState; onClose: () => void };

export default function AddTerritoryModal({ gameState, onClose }: Props) {
  const { dispatch } = useGameStore();
  const alive = Object.values(gameState.countries).filter(c => c.alive);
  const [countryId, setCountryId] = useState('');
  const [terrName, setTerrName] = useState('');
  const [prevOwner, setPrevOwner] = useState('');

  const capture = () => {
    if (!countryId || !terrName.trim()) return;
    const territory = {
      id: generateId(),
      name: terrName.trim(),
      owner: countryId,
      capturingCountryId: countryId,
      capturedOnDay: gameState.gameDay,
      capturedOnDate: gameState.gameDate,
      status: 'occupied' as const,
      moneyIncome: OCCUPIED_MONEY_INCOME,
    };
    dispatch({
      type: 'ADD_TERRITORY_CAPTURE',
      payload: {
        countryId,
        territory,
        historyEntry: {
          day: gameState.gameDay,
          date: gameState.gameDate,
          territories: [{ name: terrName.trim(), fromCountryId: prevOwner }],
        },
      },
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ADD TERRITORY CAPTURE</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        <label className="full-width">Capturing Country
          <div className="country-pick-list">
            {alive.map(c => (
              <button
                key={c.id}
                type="button"
                className={`country-pick-item ${countryId === c.id ? 'selected' : ''}`}
                onClick={() => setCountryId(c.id)}
              >
                <span className="country-pick-flag">{c.flag}</span>
                <span className="country-pick-name">{c.name}</span>
                {countryId === c.id && <span className="country-pick-check">&#10003;</span>}
              </button>
            ))}
            {alive.length === 0 && <span className="text-muted">No alive countries to choose from.</span>}
          </div>
        </label>

        <div className="form-grid">
          <label>Territory Name<input className="input-sm full-width" value={terrName} onChange={e => setTerrName(e.target.value)} placeholder="e.g. Northern Islands" /></label>
          <label>Previous Owner
            <select className="input-sm full-width" value={prevOwner} onChange={e => setPrevOwner(e.target.value)}>
              <option value="">None / Unknown</option>
              {Object.values(gameState.countries).map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
            </select>
          </label>
          <p className="text-muted">Territory starts as OCCUPIED (+1000$/+250MP per day for 3 days, then auto-integrates to +3000$/+500MP)</p>
        </div>
        <div className="center-row">
          <button className="btn btn-success" onClick={capture} disabled={!countryId || !terrName.trim()}>RECORD CAPTURE</button>
        </div>
      </div>
    </div>
  );
}

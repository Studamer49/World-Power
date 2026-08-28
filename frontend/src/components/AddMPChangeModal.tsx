import { useState } from 'react';
import { GameState } from '../types';
import { useGameStore } from '../context/GameContext';
import { generateId } from '../utils/calculations';

type Props = { gameState: GameState; onClose: () => void };

const TYPES = ['Daily MP', 'Battle loss', 'MP spent', 'MP received', 'Replenishment', 'Military aid', 'Other'];

export default function AddMPChangeModal({ gameState, onClose }: Props) {
  const { dispatch } = useGameStore();
  const alive = Object.values(gameState.countries).filter(c => c.alive);
  const [countryId, setCountryId] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState('Other');
  const [description, setDescription] = useState('');

  const add = () => {
    if (!countryId) return;
    dispatch({
      type: 'ADD_MP_CHANGE',
      payload: {
        id: generateId(),
        day: gameState.gameDay,
        date: gameState.gameDate,
        countryId,
        amount,
        type,
        description,
      },
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ADD MP CHANGE</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>
        <div className="form-grid">
          <label>Country
            <select className="input-sm full-width" value={countryId} onChange={e => setCountryId(e.target.value)}>
              <option value="">Select...</option>
              {alive.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
            </select>
          </label>
          <label>Amount (negative = MP lost)<input type="number" className="input-sm full-width" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} /></label>
          <label>Type
            <select className="input-sm full-width" value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Description<input className="input-sm full-width" value={description} onChange={e => setDescription(e.target.value)} /></label>
        </div>
        <div className="center-row">
          <button className="btn btn-success" onClick={add}>ADD CHANGE</button>
        </div>
      </div>
    </div>
  );
}

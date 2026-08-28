import { useState } from 'react';
import { GameState } from '../types';
import { useGameStore } from '../context/GameContext';
import { generateId } from '../utils/calculations';

type Props = { gameState: GameState; onClose: () => void };

const CATEGORIES = ['Replenishment', 'Research', 'Military', 'Diplomacy', 'Treaty', 'Other'];

export default function AddExpenseModal({ gameState, onClose }: Props) {
  const { dispatch } = useGameStore();
  const alive = Object.values(gameState.countries).filter(c => c.alive);
  const [countryId, setCountryId] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');

  const add = () => {
    if (!countryId || amount <= 0) return;
    dispatch({
      type: 'ADD_EXPENSE',
      payload: {
        id: generateId(),
        day: gameState.gameDay,
        date: gameState.gameDate,
        countryId,
        amount,
        category,
        description,
      },
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ADD EXPENSE</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>
        <div className="form-grid">
          <label>Country
            <select className="input-sm full-width" value={countryId} onChange={e => setCountryId(e.target.value)}>
              <option value="">Select...</option>
              {alive.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
            </select>
          </label>
          <label>Amount<input type="number" className="input-sm full-width" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} /></label>
          <label>Category
            <select className="input-sm full-width" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Description<input className="input-sm full-width" value={description} onChange={e => setDescription(e.target.value)} /></label>
        </div>
        <div className="center-row">
          <button className="btn btn-success" onClick={add}>ADD EXPENSE</button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { GameState } from '../types';
import { useGameStore } from '../context/GameContext';
import { generateId, formatMoney } from '../utils/calculations';
import { OCCUPIED_MONEY_INCOME, INTEGRATED_MONEY_INCOME } from '../data/research';

type Props = { gameState: GameState; onClose: () => void };

export default function TreatyModal({ gameState, onClose }: Props) {
  const { dispatch } = useGameStore();
  const alive = Object.values(gameState.countries).filter(c => c.alive);
  const treaties = Object.values(gameState.treaties || {});
  const [name, setName] = useState('');
  const [territoryOwnerId, setTerritoryOwnerId] = useState('');
  const [territoryId, setTerritoryId] = useState('');
  const [splits, setSplits] = useState<{ countryId: string; percent: number }[]>([]);
  const [notes, setNotes] = useState('');

  const ownerCountry = alive.find(c => c.id === territoryOwnerId);
  const availableTerritories = ownerCountry?.capturedTerritories || [];

  const addSplit = () => {
    if (splits.length >= alive.length) return;
    const usedIds = splits.map(s => s.countryId);
    const next = alive.find(c => !usedIds.includes(c.id) && c.id !== territoryOwnerId);
    if (next) {
      setSplits([...splits, { countryId: next.id, percent: 0 }]);
    }
  };

  const removeSplit = (idx: number) => {
    setSplits(splits.filter((_, i) => i !== idx));
  };

  const updateSplit = (idx: number, field: 'countryId' | 'percent', value: string | number) => {
    const updated = [...splits];
    if (field === 'percent') {
      updated[idx] = { ...updated[idx], percent: Number(value) };
    } else {
      updated[idx] = { ...updated[idx], countryId: value as string };
    }
    setSplits(updated);
  };

  const totalPercent = splits.reduce((sum, s) => sum + s.percent, 0);

  const createTreaty = () => {
    if (!name.trim() || !territoryOwnerId || !territoryId || splits.length === 0) return;
    if (totalPercent > 100) return;

    const ownerSplit = splits.find(s => s.countryId === territoryOwnerId);
    const ownerPercent = ownerSplit ? ownerSplit.percent : 0;
    const nonOwnerSplits = splits.filter(s => s.countryId !== territoryOwnerId);

    const allSplits = [...nonOwnerSplits];
    if (ownerPercent > 0) {
      allSplits.unshift({ countryId: territoryOwnerId, percent: ownerPercent });
    }

    dispatch({
      type: 'ADD_TREATY',
      payload: {
        id: generateId(),
        name: name.trim(),
        countryIds: [...new Set([territoryOwnerId, ...splits.map(s => s.countryId)])],
        territoryId,
        territoryOwnerId,
        splits: allSplits,
        day: gameState.gameDay,
        date: gameState.gameDate,
        notes,
      },
    });
    onClose();
  };

  const deleteTreaty = (treatyId: string) => {
    if (window.confirm('Delete this treaty?')) {
      dispatch({ type: 'DELETE_TREATY', payload: treatyId });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>TREATIES</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        {treaties.length > 0 && (
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <h3>ACTIVE TREATIES</h3>
            {treaties.map(t => {
              const owner = gameState.countries[t.territoryOwnerId];
              const terr = owner?.capturedTerritories.find(tr => tr.id === t.territoryId);
              return (
                <div key={t.id} className="territory-item" style={{ padding: 6, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700 }}>{t.name}</span>
                  <span className="text-muted">Day {t.day}</span>
                  <span>Terr: {terr?.name || '???'} (Owner: {owner?.name || '???'})</span>
                  <span>
                    {t.splits.map(s => {
                      const c = gameState.countries[s.countryId];
                      return `${c?.name || '???'}: ${s.percent}%`;
                    }).join(' | ')}
                  </span>
                  <button className="btn btn-xs btn-danger" onClick={() => deleteTreaty(t.id)}>DELETE</button>
                </div>
              );
            })}
          </div>
        )}

        <div className="form-grid">
          <h3>CREATE NEW TREATY</h3>
          <label>Treaty Name
            <input className="input-sm full-width" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Resource Sharing Pact" />
          </label>
          <label>Territory Owner
            <select className="input-sm full-width" value={territoryOwnerId} onChange={e => { setTerritoryOwnerId(e.target.value); setTerritoryId(''); setSplits([]); }}>
              <option value="">Select...</option>
              {alive.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name} ({c.capturedTerritories.length} terrs)</option>)}
            </select>
          </label>
          <label>Territory
            <select className="input-sm full-width" value={territoryId} onChange={e => setTerritoryId(e.target.value)}>
              <option value="">Select...</option>
              {availableTerritories.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.status}) — {formatMoney(t.status === 'integrated' ? INTEGRATED_MONEY_INCOME : OCCUPIED_MONEY_INCOME)}/day</option>
              ))}
            </select>
          </label>

          {territoryId && (
            <>
              <h4>BENEFIT SPLITS</h4>
              <p className="text-muted">Split territory income between countries. Total must equal 100%.</p>
              {splits.map((s, idx) => (
                <div key={idx} className="loss-row" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select className="input-sm" value={s.countryId} onChange={e => updateSplit(idx, 'countryId', e.target.value)}>
                    <option value="">Select...</option>
                    {alive.filter(c => c.id !== territoryOwnerId || true).map(c => (
                      <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                  <input type="number" className="input-sm" style={{ width: 60 }} value={s.percent} onChange={e => updateSplit(idx, 'percent', parseInt(e.target.value) || 0)} />
                  <span className="text-muted">%</span>
                  <button className="btn btn-xs btn-danger" onClick={() => removeSplit(idx)}>X</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <button className="btn btn-xs" onClick={addSplit}>+ ADD COUNTRY</button>
                <span className={totalPercent > 100 ? 'text-danger' : 'text-muted'}>
                  Total: {totalPercent}%{totalPercent > 100 ? ' (exceeds 100%)' : ''}
                </span>
              </div>
              <label>Notes
                <input className="input-sm full-width" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
              </label>
            </>
          )}

          <div className="center-row">
            <button
              className="btn btn-success"
              onClick={createTreaty}
              disabled={!name.trim() || !territoryOwnerId || !territoryId || splits.length === 0 || totalPercent > 100}
            >
              CREATE TREATY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

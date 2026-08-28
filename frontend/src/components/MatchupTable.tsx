import { useState } from 'react';
import { useGameStore } from '../context/GameContext';
import { MatchupModifier } from '../types';
import { UNIT_NAMES, ALL_UNIT_IDS } from '../data/militaryUnits';
import { generateId } from '../utils/calculations';

type Props = {
  onClose: () => void;
};

export default function MatchupTable({ onClose }: Props) {
  const { state, dispatch } = useGameStore();
  const matchups = state.militaryConfig.matchups;

  const [showAdd, setShowAdd] = useState(false);
  const [newAttacker, setNewAttacker] = useState<string>(ALL_UNIT_IDS[0]);
  const [newDefender, setNewDefender] = useState<string>(ALL_UNIT_IDS[0]);
  const [newModifier, setNewModifier] = useState(1.0);

  const updateModifier = (index: number, value: string) => {
    const mod = parseFloat(value);
    if (isNaN(mod)) return;
    dispatch({ type: 'UPDATE_MATCHUP', payload: { index, modifier: mod } });
  };

  const deleteMatchup = (index: number) => {
    if (window.confirm('Delete this matchup modifier?')) {
      dispatch({ type: 'DELETE_MATCHUP', payload: index });
    }
  };

  const addMatchup = () => {
    const matchup: MatchupModifier = {
      attackerUnit: newAttacker,
      defenderUnit: newDefender,
      modifier: newModifier,
    };
    dispatch({ type: 'ADD_MATCHUP', payload: matchup });
    setShowAdd(false);
    setNewModifier(1.0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>MATCHUP MODIFIERS</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        <p className="text-muted">Matchup modifiers determine how effective one unit type is against another. Values above 1.0 = advantage, below 1.0 = disadvantage.</p>

        <div className="matchup-table-wrapper">
          <table className="matchup-table">
            <thead>
              <tr>
                <th>Attacker</th>
                <th>Defender</th>
                <th>Modifier</th>
                <th>Effect</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matchups.map((m, i) => (
                <tr key={i}>
                  <td>{UNIT_NAMES[m.attackerUnit] || m.attackerUnit}</td>
                  <td>{UNIT_NAMES[m.defenderUnit] || m.defenderUnit}</td>
                  <td>
                    <input
                      type="number"
                      className="input-sm ratio-input"
                      value={m.modifier}
                      step="0.05"
                      onChange={e => updateModifier(i, e.target.value)}
                    />
                  </td>
                  <td>
                    <span className={m.modifier > 1 ? 'text-success' : m.modifier < 1 ? 'text-danger' : 'text-muted'}>
                      {m.modifier > 1 ? 'ADVANTAGE' : m.modifier < 1 ? 'DISADVANTAGE' : 'NEUTRAL'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-xs btn-ghost" onClick={() => deleteMatchup(i)}>X</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAdd ? (
          <div className="add-matchup-form">
            <select className="input-sm" value={newAttacker} onChange={e => setNewAttacker(e.target.value)}>
              {ALL_UNIT_IDS.map(id => <option key={id} value={id}>{UNIT_NAMES[id]}</option>)}
            </select>
            <span>vs</span>
            <select className="input-sm" value={newDefender} onChange={e => setNewDefender(e.target.value)}>
              {ALL_UNIT_IDS.map(id => <option key={id} value={id}>{UNIT_NAMES[id]}</option>)}
            </select>
            <input type="number" className="input-sm ratio-input" value={newModifier} step="0.05" onChange={e => setNewModifier(parseFloat(e.target.value) || 1.0)} />
            <button className="btn btn-xs btn-success" onClick={addMatchup}>ADD</button>
            <button className="btn btn-xs btn-ghost" onClick={() => setShowAdd(false)}>CANCEL</button>
          </div>
        ) : (
          <button className="btn btn-sm" onClick={() => setShowAdd(true)}>+ ADD MATCHUP</button>
        )}
      </div>
    </div>
  );
}

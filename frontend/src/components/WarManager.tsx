import { useState } from 'react';
import { GameState, War } from '../types';
import { useGameStore } from '../context/GameContext';
import { generateId, formatMP } from '../utils/calculations';

type Props = {
  gameState: GameState;
  onClose: () => void;
};

export default function WarManager({ gameState, onClose }: Props) {
  const { dispatch } = useGameStore();
  const alive = Object.values(gameState.countries).filter(c => c.alive);
  const wars = Object.values(gameState.wars);

  const [showCreate, setShowCreate] = useState(false);
  const [warName, setWarName] = useState('');
  const [attackers, setAttackers] = useState<string[]>([]);
  const [defenders, setDefenders] = useState<string[]>([]);
  const [expandedWar, setExpandedWar] = useState<string | null>(null);
  const [scoreReason, setScoreReason] = useState('');
  const [scoreAmount, setScoreAmount] = useState(5);
  const [scoreCountry, setScoreCountry] = useState('');

  const createWar = () => {
    if (!warName || attackers.length === 0 || defenders.length === 0) return;
    const war: War = {
      id: generateId(),
      name: warName,
      attackerIds: attackers,
      defenderIds: defenders,
      startDate: gameState.gameDate,
      startDay: gameState.gameDay,
      endDate: '',
      endDay: 0,
      status: 'active',
      battles: [],
      territoriesCaptured: [],
      territoriesLost: [],
      warScore: {},
      notes: '',
    };
    dispatch({ type: 'ADD_WAR', payload: war });
    setWarName('');
    setAttackers([]);
    setDefenders([]);
    setShowCreate(false);
  };

  const updateWarStatus = (warId: string, status: 'active' | 'truce' | 'ended') => {
    const updates: Partial<War> = { status };
    if (status === 'ended') {
      updates.endDate = gameState.gameDate;
      updates.endDay = gameState.gameDay;
    }
    dispatch({ type: 'UPDATE_WAR', payload: { id: warId, updates } });
  };

  const deleteWar = (warId: string) => {
    if (window.confirm('Delete this war permanently?')) {
      dispatch({ type: 'DELETE_WAR', payload: warId });
    }
  };

  const addWarScore = (warId: string, countryId: string, amount: number, reason: string) => {
    const event = {
      id: generateId(),
      warId,
      countryId,
      amount,
      reason,
      day: gameState.gameDay,
      date: gameState.gameDate,
    };
    dispatch({ type: 'ADD_WAR_SCORE_EVENT', payload: event });
    const war = gameState.wars[warId];
    if (war) {
      const currentScore = war.warScore[countryId] || 0;
      dispatch({
        type: 'UPDATE_WAR',
        payload: {
          id: warId,
          updates: { warScore: { ...war.warScore, [countryId]: currentScore + amount } },
        },
      });
    }
    setScoreReason('');
  };

  const getCountryName = (id: string) => gameState.countries[id]?.name || '???';

  const getWarScoreEvents = (warId: string) => gameState.warScoreEvents.filter(e => e.warId === warId);

  const toggleAttacker = (id: string) => {
    setAttackers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setDefenders(prev => prev.filter(x => x !== id));
  };

  const toggleDefender = (id: string) => {
    setDefenders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setAttackers(prev => prev.filter(x => x !== id));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>WAR MANAGER</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        <button className="btn btn-sm btn-accent" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'CANCEL' : '+ DECLARE WAR'}
        </button>

        {showCreate && (
          <div className="war-create-form">
            <input className="input-sm full-width" placeholder="War name..." value={warName} onChange={e => setWarName(e.target.value)} />
            <div className="war-sides">
              <div>
                <h4>Attackers</h4>
                {alive.map(c => (
                  <label key={c.id} className="war-toggle">
                    <input type="checkbox" checked={attackers.includes(c.id)} onChange={() => toggleAttacker(c.id)} />
                    {c.flag} {c.name}
                  </label>
                ))}
              </div>
              <div>
                <h4>Defenders</h4>
                {alive.map(c => (
                  <label key={c.id} className="war-toggle">
                    <input type="checkbox" checked={defenders.includes(c.id)} onChange={() => toggleDefender(c.id)} />
                    {c.flag} {c.name}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-success" onClick={createWar}>CREATE WAR</button>
          </div>
        )}

        <div className="wars-list">
          {wars.length === 0 && <div className="empty-state">No wars declared.</div>}
          {wars.sort((a, b) => b.startDay - a.startDay).map(war => {
            const scoreEvents = getWarScoreEvents(war.id);
            return (
              <div key={war.id} className="war-card">
                <div className="war-header" onClick={() => setExpandedWar(expandedWar === war.id ? null : war.id)}>
                  <span className={`status-badge ${war.status}`}>{war.status.toUpperCase()}</span>
                  <strong>{war.name}</strong>
                  <span>Day {war.startDay}</span>
                  <span>Attackers: {war.attackerIds.map(getCountryName).join(', ')}</span>
                  <span>Defenders: {war.defenderIds.map(getCountryName).join(', ')}</span>
                  <span>{expandedWar === war.id ? '\u25BC' : '\u25B6'}</span>
                </div>
                {expandedWar === war.id && (
                  <div className="war-detail">
                    <div className="war-scores">
                      <h4>War Scores</h4>
                      {Object.entries(war.warScore).map(([cid, score]) => (
                        <div key={cid} className="score-row">
                          <span>{getCountryName(cid)}</span>
                          <span className={score > 0 ? 'text-success' : score < 0 ? 'text-danger' : ''}>{score}</span>
                        </div>
                      ))}
                    </div>
                    <div className="war-score-add">
                      <select className="input-sm" value={scoreCountry} onChange={e => setScoreCountry(e.target.value)}>
                        <option value="">Country...</option>
                        {alive.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="number" className="input-sm" value={scoreAmount} onChange={e => setScoreAmount(parseInt(e.target.value) || 0)} />
                      <input className="input-sm" placeholder="Reason..." value={scoreReason} onChange={e => setScoreReason(e.target.value)} />
                      <button className="btn btn-xs" onClick={() => scoreCountry && addWarScore(war.id, scoreCountry, scoreAmount, scoreReason)}>ADD SCORE</button>
                    </div>
                    <div className="war-score-events">
                      {scoreEvents.map(ev => (
                        <div key={ev.id} className="score-event">
                          <span>Day {ev.day}</span>
                          <span>{getCountryName(ev.countryId)}</span>
                          <span className={ev.amount > 0 ? 'text-success' : 'text-danger'}>{ev.amount > 0 ? '+' : ''}{ev.amount}</span>
                          <span>{ev.reason}</span>
                        </div>
                      ))}
                    </div>
                    <div className="war-battles">
                      <h4>Battles ({war.battles.length})</h4>
                      {war.battles.map(bid => {
                        const b = gameState.allBattles.find(x => x.id === bid);
                        if (!b) return null;
                        return (
                          <div key={bid} className="war-battle-item">
                            <span>Day {b.day}</span>
                            <span>{getCountryName(b.attackerId)} vs {getCountryName(b.defenderId)}</span>
                            <span>{b.target}</span>
                            <span>EP: {formatMP(b.attackerEffectivePower)} vs {formatMP(b.defenderEffectivePower)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="war-actions">
                      {war.status !== 'active' && (
                        <button className="btn btn-xs" onClick={() => updateWarStatus(war.id, 'active')}>SET ACTIVE</button>
                      )}
                      {war.status === 'active' && (
                        <button className="btn btn-xs btn-warning" onClick={() => updateWarStatus(war.id, 'truce')}>TRUCE</button>
                      )}
                      {war.status !== 'ended' && (
                        <button className="btn btn-xs btn-danger" onClick={() => updateWarStatus(war.id, 'ended')}>END WAR</button>
                      )}
                      <button className="btn btn-xs btn-danger" onClick={() => deleteWar(war.id)}>DELETE WAR</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

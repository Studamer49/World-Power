import { useState } from 'react';
import { GameState, Battle } from '../types';
import { useGameStore } from '../context/GameContext';
import { calculateBattle, generateId, autoDistributeLoss, formatMP, BattleCalcSide } from '../utils/calculations';
import { ALL_UNIT_IDS, UNIT_NAMES } from '../data/militaryUnits';

type Props = {
  gameState: GameState;
  onClose: () => void;
  prefillAttacker?: string;
  prefillDefender?: string;
};

type SideUnits = { unitType: string; tier: number; mp: number }[];

export default function BattleCalculator({ gameState, onClose, prefillAttacker, prefillDefender }: Props) {
  const { dispatch } = useGameStore();
  const alive = Object.values(gameState.countries).filter(c => c.alive);

  const [attackerId, setAttackerId] = useState(prefillAttacker || '');
  const [defenderId, setDefenderId] = useState(prefillDefender || '');
  const [target, setTarget] = useState('');
  const [attackerUnits, setAttackerUnits] = useState<SideUnits>([{ unitType: 'infantry', tier: 1, mp: 0 }]);
  const [defenderUnits, setDefenderUnits] = useState<SideUnits>([{ unitType: 'infantry', tier: 1, mp: 0 }]);
  const [result, setResult] = useState<ReturnType<typeof calculateBattle> | null>(null);
  const [mpLostAttacker, setMpLostAttacker] = useState(0);
  const [mpLostDefender, setMpLostDefender] = useState(0);
  const [attackerLossDist, setAttackerLossDist] = useState<Record<string, number>>({});
  const [defenderLossDist, setDefenderLossDist] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [territoryCaptured, setTerritoryCaptured] = useState(false);
  const [territoryName, setTerritoryName] = useState('');
  const [warId, setWarId] = useState('');

  const activeWars = Object.values(gameState.wars).filter(w => w.status === 'active');
  const attackerCountry = gameState.countries[attackerId];
  const defenderCountry = gameState.countries[defenderId];

  const addUnit = (side: 'attacker' | 'defender') => {
    const setter = side === 'attacker' ? setAttackerUnits : setDefenderUnits;
    setter(prev => [...prev, { unitType: 'infantry', tier: 1, mp: 0 }]);
  };

  const removeUnit = (side: 'attacker' | 'defender', idx: number) => {
    const setter = side === 'attacker' ? setAttackerUnits : setDefenderUnits;
    setter(prev => prev.filter((_, i) => i !== idx));
  };

  const updateUnit = (side: 'attacker' | 'defender', idx: number, field: string, value: any) => {
    const setter = side === 'attacker' ? setAttackerUnits : setDefenderUnits;
    setter(prev => prev.map((u, i) => i === idx ? { ...u, [field]: value } : u));
  };

  const doCalculate = () => {
    if (!attackerId || !defenderId) return;
    const attackerSide: BattleCalcSide = { countryId: attackerId, units: attackerUnits.filter(u => u.mp > 0) };
    const defenderSide: BattleCalcSide = { countryId: defenderId, units: defenderUnits.filter(u => u.mp > 0) };
    const r = calculateBattle(gameState.militaryConfig, attackerSide, defenderSide);
    setResult(r);
    setMpLostAttacker(0);
    setMpLostDefender(0);
    setAttackerLossDist({});
    setDefenderLossDist({});
  };

  const autoDistAttacker = () => {
    if (!result) return;
    const dist = autoDistributeLoss(mpLostAttacker, result.attackerUnits);
    setAttackerLossDist(dist);
  };

  const autoDistDefender = () => {
    if (!result) return;
    const dist = autoDistributeLoss(mpLostDefender, result.defenderUnits);
    setDefenderLossDist(dist);
  };

  const recordBattle = () => {
    if (!result || !attackerId || !defenderId) return;
    const battle: Battle = {
      id: generateId(),
      warId: warId || undefined,
      day: gameState.gameDay,
      date: gameState.gameDate,
      attackerId,
      defenderId,
      target: target || 'General',
      attackerUnits: result.attackerUnits,
      defenderUnits: result.defenderUnits,
      attackerMP: result.attackerTotalMP,
      defenderMP: result.defenderTotalMP,
      attackerEffectivePower: result.attackerEffectivePower,
      defenderEffectivePower: result.defenderEffectivePower,
      winner: result.winner === 'attacker' ? attackerId : defenderId,
      result: result.winner === 'attacker' ? 'Attacker Victory' : 'Defender Victory',
      mpLostAttacker,
      mpLostDefender,
      territoryCaptured,
      territoryName: territoryCaptured ? territoryName : '',
      notes,
    };
    dispatch({ type: 'ADD_BATTLE', payload: battle });
    if (warId) {
      dispatch({ type: 'ADD_BATTLE_TO_WAR', payload: { warId, battleId: battle.id } });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>BATTLE CALCULATOR</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        <div className="battle-calc-grid">
          <div className="battle-side">
            <h3>ATTACKER</h3>
            <select className="input-sm full-width" value={attackerId} onChange={e => setAttackerId(e.target.value)}>
              <option value="">Select attacker...</option>
              {alive.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
            </select>
            {attackerUnits.map((u, i) => (
              <div key={i} className="battle-unit-row">
                <select className="input-sm" value={u.unitType} onChange={e => updateUnit('attacker', i, 'unitType', e.target.value)}>
                  {ALL_UNIT_IDS.map(id => <option key={id} value={id}>{UNIT_NAMES[id]}</option>)}
                </select>
                <select className="input-sm tier-select" value={u.tier} onChange={e => updateUnit('attacker', i, 'tier', parseInt(e.target.value))}>
                  {[1, 2, 3, 4, 5].map(t => <option key={t} value={t}>T{t}</option>)}
                </select>
                <input type="number" className="input-sm mp-input" placeholder="MP" value={u.mp || ''} onChange={e => updateUnit('attacker', i, 'mp', parseInt(e.target.value) || 0)} />
                {attackerUnits.length > 1 && <button className="btn btn-xs btn-ghost" onClick={() => removeUnit('attacker', i)}>X</button>}
              </div>
            ))}
            <button className="btn btn-xs" onClick={() => addUnit('attacker')}>+ ADD UNIT</button>
            {attackerCountry && (
              <div className="side-info">
                Total MP Available: {formatMP(attackerCountry.mp)}
              </div>
            )}
          </div>

          <div className="battle-vs">
            <span>VS</span>
          </div>

          <div className="battle-side">
            <h3>DEFENDER</h3>
            <select className="input-sm full-width" value={defenderId} onChange={e => setDefenderId(e.target.value)}>
              <option value="">Select defender...</option>
              {alive.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
            </select>
            {defenderUnits.map((u, i) => (
              <div key={i} className="battle-unit-row">
                <select className="input-sm" value={u.unitType} onChange={e => updateUnit('defender', i, 'unitType', e.target.value)}>
                  {ALL_UNIT_IDS.map(id => <option key={id} value={id}>{UNIT_NAMES[id]}</option>)}
                </select>
                <select className="input-sm tier-select" value={u.tier} onChange={e => updateUnit('defender', i, 'tier', parseInt(e.target.value))}>
                  {[1, 2, 3, 4, 5].map(t => <option key={t} value={t}>T{t}</option>)}
                </select>
                <input type="number" className="input-sm mp-input" placeholder="MP" value={u.mp || ''} onChange={e => updateUnit('defender', i, 'mp', parseInt(e.target.value) || 0)} />
                {defenderUnits.length > 1 && <button className="btn btn-xs btn-ghost" onClick={() => removeUnit('defender', i)}>X</button>}
              </div>
            ))}
            <button className="btn btn-xs" onClick={() => addUnit('defender')}>+ ADD UNIT</button>
            {defenderCountry && (
              <div className="side-info">
                Total MP Available: {formatMP(defenderCountry.mp)}
              </div>
            )}
          </div>
        </div>

        <div className="battle-target-row">
          <input className="input-sm" placeholder="Target (e.g. 'Siberian Front')" value={target} onChange={e => setTarget(e.target.value)} />
          {activeWars.length > 0 && (
            <select className="input-sm" value={warId} onChange={e => setWarId(e.target.value)}>
              <option value="">No War</option>
              {activeWars.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
        </div>

        <div className="center-row">
          <button className="btn btn-accent" onClick={doCalculate}>CALCULATE BATTLE</button>
        </div>

        {result && (
          <div className="battle-result">
            <div className={`winner-banner ${result.winner}`}>
              WINNER: {result.winner === 'attacker' ? (attackerCountry?.name || 'ATTACKER') : (defenderCountry?.name || 'DEFENDER')}
            </div>

            <div className="result-grid">
              <div className="result-side">
                <h4>ATTACKER BREAKDOWN</h4>
                <div className="result-row">
                  <span>Total MP</span><span className="num">{formatMP(result.attackerTotalMP)}</span>
                </div>
                <div className="result-row total">
                  <span>Effective Power</span><span className="num">{formatMP(result.attackerEffectivePower)}</span>
                </div>
                {result.attackerUnits.map((u, i) => (
                  <div key={i} className="result-unit">
                    <span>{UNIT_NAMES[u.unitType]} T{u.tier}</span>
                    <span>{formatMP(u.mpCommitted)} × {u.ratio.toFixed(2)} × {u.matchupModifier.toFixed(2)} = <strong>{formatMP(u.effectivePower)}</strong></span>
                  </div>
                ))}
              </div>
              <div className="result-side">
                <h4>DEFENDER BREAKDOWN</h4>
                <div className="result-row">
                  <span>Total MP</span><span className="num">{formatMP(result.defenderTotalMP)}</span>
                </div>
                <div className="result-row total">
                  <span>Effective Power</span><span className="num">{formatMP(result.defenderEffectivePower)}</span>
                </div>
                {result.defenderUnits.map((u, i) => (
                  <div key={i} className="result-unit">
                    <span>{UNIT_NAMES[u.unitType]} T{u.tier}</span>
                    <span>{formatMP(u.mpCommitted)} × {u.ratio.toFixed(2)} × {u.matchupModifier.toFixed(2)} = <strong>{formatMP(u.effectivePower)}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mp-loss-section">
              <h4>MP LOSSES</h4>
              <div className="loss-row">
                <label>Attacker MP Lost:</label>
                <input type="number" className="input-sm" value={mpLostAttacker} onChange={e => setMpLostAttacker(parseInt(e.target.value) || 0)} />
                <button className="btn btn-xs" onClick={autoDistAttacker}>AUTO DISTRIBUTE</button>
              </div>
              {Object.keys(attackerLossDist).length > 0 && (
                <div className="loss-dist">
                  {Object.entries(attackerLossDist).map(([unit, loss]) => (
                    <span key={unit} className="loss-item">{UNIT_NAMES[unit]}: -{formatMP(loss)}</span>
                  ))}
                </div>
              )}
              <div className="loss-row">
                <label>Defender MP Lost:</label>
                <input type="number" className="input-sm" value={mpLostDefender} onChange={e => setMpLostDefender(parseInt(e.target.value) || 0)} />
                <button className="btn btn-xs" onClick={autoDistDefender}>AUTO DISTRIBUTE</button>
              </div>
              {Object.keys(defenderLossDist).length > 0 && (
                <div className="loss-dist">
                  {Object.entries(defenderLossDist).map(([unit, loss]) => (
                    <span key={unit} className="loss-item">{UNIT_NAMES[unit]}: -{formatMP(loss)}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="territory-result">
              <label>
                <input type="checkbox" checked={territoryCaptured} onChange={e => setTerritoryCaptured(e.target.checked)} />
                Territory Captured?
              </label>
              {territoryCaptured && (
                <input className="input-sm" placeholder="Territory name" value={territoryName} onChange={e => setTerritoryName(e.target.value)} />
              )}
            </div>

            <div className="battle-notes-row">
              <input className="input-sm full-width" placeholder="Battle notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="center-row">
              <button className="btn btn-success" onClick={recordBattle}>RECORD BATTLE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

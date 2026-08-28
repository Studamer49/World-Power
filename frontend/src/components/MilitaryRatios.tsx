import { useState } from 'react';
import { useGameStore } from '../context/GameContext';
import { UNIT_NAMES, ALL_UNIT_IDS } from '../data/militaryUnits';

type Props = {
  onClose: () => void;
};

export default function MilitaryRatios({ onClose }: Props) {
  const { state, dispatch } = useGameStore();
  const config = state.militaryConfig;
  const [editingTierReq, setEditingTierReq] = useState<number | null>(null);
  const [tierReqValue, setTierReqValue] = useState('');

  const updateRatio = (unitId: string, tier: number, value: string) => {
    const ratio = parseFloat(value);
    if (isNaN(ratio)) return;
    dispatch({ type: 'UPDATE_UNIT_RATIO', payload: { unitId, tier, ratio } });
  };

  const resetConfig = () => {
    if (window.confirm('Reset all military ratios to defaults?')) {
      dispatch({ type: 'RESET_MILITARY_CONFIG' });
    }
  };

  const updateTierReq = (tier: number, value: string) => {
    dispatch({
      type: 'UPDATE_MILITARY_CONFIG',
      payload: {
        tierResearchRequirements: { ...config.tierResearchRequirements, [tier]: value },
      },
    });
    setEditingTierReq(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>MILITARY RATIOS</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        <p className="text-muted">Unit ratios determine how efficiently MP translates to effective power at each tier.</p>

        <div className="ratio-table-wrapper">
          <table className="ratio-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>T1</th>
                <th>T2</th>
                <th>T3</th>
                <th>T4</th>
                <th>T5</th>
              </tr>
            </thead>
            <tbody>
              {ALL_UNIT_IDS.map(unitId => {
                const unit = config.unitConfigs[unitId];
                if (!unit) return null;
                return (
                  <tr key={unitId}>
                    <td className="unit-label">{UNIT_NAMES[unitId]}</td>
                    {unit.tierRatios.map((ratio, i) => (
                      <td key={i}>
                        <input
                          type="number"
                          className="input-sm ratio-input"
                          value={ratio}
                          step="0.05"
                          onChange={e => updateRatio(unitId, i + 1, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="section-block">
          <h4>TIER RESEARCH REQUIREMENTS (click to edit)</h4>
          <div className="tier-req-grid">
            {[1, 2, 3, 4, 5].map(tier => (
              <div key={tier} className="tier-req-row">
                <span>Tier {tier}:</span>
                {editingTierReq === tier ? (
                  <span className="field-edit-group">
                    <input
                      type="text"
                      className="input-sm"
                      value={tierReqValue}
                      onChange={e => setTierReqValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && updateTierReq(tier, tierReqValue)}
                      autoFocus
                    />
                    <button className="btn btn-xs" onClick={() => updateTierReq(tier, tierReqValue)}>OK</button>
                    <button className="btn btn-xs btn-ghost" onClick={() => setEditingTierReq(null)}>X</button>
                  </span>
                ) : (
                  <span
                    className="clickable"
                    onClick={() => { setEditingTierReq(tier); setTierReqValue(config.tierResearchRequirements[tier] || ''); }}
                  >
                    {config.tierResearchRequirements[tier] || 'None'} <span className="text-muted">[edit]</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="section-block">
          <h4>UNIT DESCRIPTIONS</h4>
          {ALL_UNIT_IDS.map(unitId => {
            const unit = config.unitConfigs[unitId];
            if (!unit) return null;
            return (
              <div key={unitId} className="unit-desc-row">
                <strong>{UNIT_NAMES[unitId]}</strong>
                <span className="text-muted">{unit.description}</span>
                <span>Role: {unit.role}</span>
                <span>Research: {unit.researchRequirement}</span>
                <span>Counters: {unit.counters.map(c => UNIT_NAMES[c] || c).join(', ') || 'None'}</span>
                <span>Countered by: {unit.counteredBy.map(c => UNIT_NAMES[c] || c).join(', ') || 'None'}</span>
              </div>
            );
          })}
        </div>

        <div className="center-row">
          <button className="btn btn-danger" onClick={resetConfig}>RESET DEFAULT RATIOS</button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { GameState } from '../types';
import { UNIT_NAMES, ALL_UNIT_IDS } from '../data/militaryUnits';
import { getFlagEmoji } from '../data/flags';
import { formatMP } from '../utils/calculations';
import WorldMap from './WorldMap';

type Props = {
  gameState: GameState;
  onSelectCountry: (id: string) => void;
};

type Tab = 'map' | 'wars' | 'matchup' | 'ratios';

export default function PublicIntel({ gameState, onSelectCountry }: Props) {
  const [tab, setTab] = useState<Tab>('map');
  const [expandedWar, setExpandedWar] = useState<string | null>(null);

  const wars = Object.values(gameState.wars).sort((a, b) => b.startDay - a.startDay);
  const nameOf = (id: string) => gameState.countries[id]?.name || '???';
  const flagsOf = (id: string) => getFlagEmoji(gameState.countries[id]?.name);
  const getWarScoreEvents = (warId: string) => gameState.warScoreEvents.filter(e => e.warId === warId);

  return (
    <div className="intel-view">
      <nav className="sub-nav">
        <button className={`btn btn-xs ${tab === 'map' ? 'btn-accent' : ''}`} onClick={() => setTab('map')}>MAP</button>
        <button className={`btn btn-xs ${tab === 'wars' ? 'btn-accent' : ''}`} onClick={() => setTab('wars')}>WARS ({wars.length})</button>
        <button className={`btn btn-xs ${tab === 'matchup' ? 'btn-accent' : ''}`} onClick={() => setTab('matchup')}>MATCHUP</button>
        <button className={`btn btn-xs ${tab === 'ratios' ? 'btn-accent' : ''}`} onClick={() => setTab('ratios')}>MILITARY RATIOS</button>
      </nav>

      {tab === 'map' && (
        <WorldMap gameState={gameState} onSelectCountry={onSelectCountry} />
      )}

      {tab === 'wars' && (
        <div className="wars-list">
          {wars.length === 0 && <div className="empty-state">No wars declared.</div>}
          {wars.map(war => {
            const scoreEvents = getWarScoreEvents(war.id);
            return (
              <div key={war.id} className="war-card">
                <div className="war-header" onClick={() => setExpandedWar(expandedWar === war.id ? null : war.id)}>
                  <span className={`status-badge ${war.status}`}>{war.status.toUpperCase()}</span>
                  <strong>{war.name}</strong>
                  <span>Day {war.startDay}</span>
                  <span>{flagsOf(war.attackerIds[0])} Attackers: {war.attackerIds.map(nameOf).join(', ')}</span>
                  <span>{flagsOf(war.defenderIds[0])} Defenders: {war.defenderIds.map(nameOf).join(', ')}</span>
                  <span>{expandedWar === war.id ? '\u25BC' : '\u25B6'}</span>
                </div>
                {expandedWar === war.id && (
                  <div className="war-detail">
                    <div className="war-scores">
                      <h4>War Scores</h4>
                      {Object.entries(war.warScore).length === 0 && <span className="text-muted">No scores yet.</span>}
                      {Object.entries(war.warScore).map(([cid, score]) => (
                        <div key={cid} className="score-row">
                          <span>{getFlagEmoji(nameOf(cid))} {nameOf(cid)}</span>
                          <span className={score > 0 ? 'text-success' : score < 0 ? 'text-danger' : ''}>{score}</span>
                        </div>
                      ))}
                    </div>
                    <div className="war-score-events">
                      {scoreEvents.map(ev => (
                        <div key={ev.id} className="score-event">
                          <span>Day {ev.day}</span>
                          <span>{nameOf(ev.countryId)}</span>
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
                            <span>{getFlagEmoji(nameOf(b.attackerId))} {nameOf(b.attackerId)} vs {getFlagEmoji(nameOf(b.defenderId))} {nameOf(b.defenderId)}</span>
                            <span>{b.target}</span>
                            <span>EP: {formatMP(b.attackerEffectivePower)} vs {formatMP(b.defenderEffectivePower)}</span>
                          </div>
                        );
                      })}
                      {war.battles.length === 0 && <span className="text-muted">No battles recorded.</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'matchup' && (
        <div className="section-block">
          <h3>MATCHUP MODIFIERS</h3>
          <p className="text-muted">How effective each unit type is against another. Above 1.0 = advantage, below 1.0 = disadvantage.</p>
          <div className="matchup-table-wrapper">
            <table className="matchup-table">
              <thead>
                <tr><th>Attacker</th><th>Defender</th><th>Modifier</th><th>Effect</th></tr>
              </thead>
              <tbody>
                {gameState.militaryConfig.matchups.map((m, i) => (
                  <tr key={i}>
                    <td>{UNIT_NAMES[m.attackerUnit] || m.attackerUnit}</td>
                    <td>{UNIT_NAMES[m.defenderUnit] || m.defenderUnit}</td>
                    <td>{m.modifier.toFixed(2)}</td>
                    <td>
                      <span className={m.modifier > 1 ? 'text-success' : m.modifier < 1 ? 'text-danger' : 'text-muted'}>
                        {m.modifier > 1 ? 'ADVANTAGE' : m.modifier < 1 ? 'DISADVANTAGE' : 'NEUTRAL'}
                      </span>
                    </td>
                  </tr>
                ))}
                {gameState.militaryConfig.matchups.length === 0 && (
                  <tr><td colSpan={4} className="text-muted">No matchup modifiers defined.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ratios' && (
        <div className="section-block">
          <h3>MILITARY RATIOS</h3>
          <p className="text-muted">How efficiently MP translates to effective power at each tier.</p>
          <div className="ratio-table-wrapper">
            <table className="ratio-table">
              <thead>
                <tr><th>Unit</th><th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>T5</th></tr>
              </thead>
              <tbody>
                {ALL_UNIT_IDS.map(unitId => {
                  const unit = gameState.militaryConfig.unitConfigs[unitId];
                  if (!unit) return null;
                  return (
                    <tr key={unitId}>
                      <td className="unit-label">{UNIT_NAMES[unitId]}</td>
                      {unit.tierRatios.map((ratio, i) => <td key={i}>{ratio.toFixed(2)}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="section-block">
            <h4>TIER RESEARCH REQUIREMENTS</h4>
            {[1, 2, 3, 4, 5].map(tier => (
              <div key={tier} className="tier-req-row">
                <span>Tier {tier}:</span>
                <span>{gameState.militaryConfig.tierResearchRequirements[tier] || 'None'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

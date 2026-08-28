import { Country, GameState } from '../types';
import { formatMoney, calculateMilitaryPower } from '../utils/calculations';
import { RESEARCH_TIERS, getResearchTierForGDP, ECONOMIC_INVESTMENT_GDP_CAP, OCCUPIED_MONEY_INCOME, INTEGRATED_MONEY_INCOME, OCCUPATION_DAYS } from '../data/research';
import { ALL_UNIT_IDS, UNIT_NAMES, getUnitRatio } from '../data/militaryUnits';

type Props = {
  country: Country;
  allCountries: Record<string, Country>;
  gameState: GameState;
  onBack: () => void;
};

export default function PublicCountryDetail({ country, allCountries, gameState, onBack }: Props) {
  const c = country;
  const config = gameState.militaryConfig;

  const occupiedTerrCount = c.capturedTerritories.filter(t => t.status === 'occupied').length;
  const integratedTerrCount = c.capturedTerritories.filter(t => t.status === 'integrated').length;
  const territoryIncome = occupiedTerrCount * OCCUPIED_MONEY_INCOME + integratedTerrCount * INTEGRATED_MONEY_INCOME;

  const effectiveDailyIncome = c.dailyIncome + territoryIncome;

  const autoTier = getResearchTierForGDP(c.gdp);
  const effectiveTier = autoTier;
  const investmentGDP = c.investmentGDP || 0;
  const milPower = calculateMilitaryPower(c, config);

  const inventory = c.unitInventory || {};

  return (
    <div className="country-detail">
      <div className="detail-header">
        <button className="btn btn-sm" onClick={onBack}>&larr; BACK</button>
        <span className="detail-title">{c.flag} {c.name}</span>
        <span className={`status-badge ${c.alive ? 'alive' : 'dead'}`}>{c.alive ? 'ALIVE' : 'DEAD'}</span>
      </div>

      <div className="detail-grid">
        <section className="detail-section">
          <h3>IDENTITY</h3>
          <div className="field-row">
            <span className="field-label">Country Name</span>
            <span className="field-value">{c.name || '\u2014'}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Player</span>
            <span className="field-value">{c.playerName || '\u2014'}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Leader</span>
            <span className="field-value">{c.leaderName || '\u2014'}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Government</span>
            <span className="field-value">{c.governmentName || '\u2014'}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Date Created</span>
            <span className="field-value">{c.dateCreated || '\u2014'}</span>
          </div>
        </section>

        <section className="detail-section">
          <h3>ECONOMY</h3>
          <div className="field-row">
            <span className="field-label">Money</span>
            <span className="field-value">{formatMoney(c.money)}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Daily Income</span>
            <span className="field-value">{formatMoney(c.dailyIncome)}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Occupied Terr Income</span>
            <span className="field-value">
              +{formatMoney(occupiedTerrCount * OCCUPIED_MONEY_INCOME)}/day
              <span className="text-muted"> ({occupiedTerrCount} terrs)</span>
            </span>
          </div>
          <div className="field-row">
            <span className="field-label">Integrated Terr Income</span>
            <span className="field-value">
              +{formatMoney(integratedTerrCount * INTEGRATED_MONEY_INCOME)}/day
              <span className="text-muted"> ({integratedTerrCount} terrs)</span>
            </span>
          </div>
          <div className="field-row">
            <span className="field-label">Total Daily Income</span>
            <span className="field-value"><strong>{formatMoney(effectiveDailyIncome)}</strong></span>
          </div>
          <div className="field-row">
            <span className="field-label">GDP</span>
            <span className="field-value">{c.gdp}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Investment GDP</span>
            <span className="field-value">{investmentGDP} / {ECONOMIC_INVESTMENT_GDP_CAP}</span>
          </div>
        </section>

        <section className="detail-section full-width">
          <h3>MILITARY</h3>
          <div className="mil-summary">
            <div className="field-row">
              <span className="field-label">MP</span>
              <span className="field-value">{formatMoney(c.mp)}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Daily MP</span>
              <span className="field-value">{formatMoney(c.dailyMP)}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Total Effective Power</span>
              <span className="field-value"><strong>{formatMoney(milPower)}</strong></span>
            </div>
          </div>

          <h4>UNIT INVENTORY</h4>
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Tier</th>
                  <th>MP</th>
                  <th>Ratio</th>
                  <th>Effective Power</th>
                </tr>
              </thead>
              <tbody>
                {ALL_UNIT_IDS.map(unitId => {
                  const slot = inventory[unitId as keyof typeof inventory] || { mp: 0, tier: 1 };
                  if (slot.mp === 0) return null;
                  const ratio = getUnitRatio(config, unitId, slot.tier);
                  const ep = Math.round(slot.mp * ratio);
                  return (
                    <tr key={unitId}>
                      <td className="unit-label">{UNIT_NAMES[unitId]}</td>
                      <td>T{slot.tier}</td>
                      <td className="num">{formatMoney(slot.mp)}</td>
                      <td className="num">{ratio.toFixed(2)}</td>
                      <td className="num">{formatMoney(ep)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="detail-section">
          <h3>RESEARCH</h3>
          <div className="field-row">
            <span className="field-label">Research Tier</span>
            <span className="field-value"><strong>T{effectiveTier}</strong></span>
          </div>
          <div className="research-tree">
            {RESEARCH_TIERS.map(tier => {
              const unlocked = effectiveTier >= tier.tier;
              return (
                <div key={tier.tier} className={`tier-block ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="tier-header">
                    <span className="tier-label">Tier {tier.tier} — {tier.label}</span>
                    {unlocked && <span className="text-success">UNLOCKED</span>}
                  </div>
                  <div className="tier-items">
                    {tier.items.map(item => (
                      <span key={item} className={`research-tag ${unlocked ? 'completed' : 'available'}`}>
                        {unlocked ? '\u2713' : '\u25CB'} {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="detail-section">
          <h3>TERRITORY</h3>
          <div className="field-row">
            <span className="field-label">Total Captured</span>
            <span className="field-value">{c.capturedTerritories.length}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Occupied</span>
            <span className="field-value">{occupiedTerrCount}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Integrated</span>
            <span className="field-value">{integratedTerrCount}</span>
          </div>
          {c.capturedTerritories.length > 0 && (
            <div className="territory-list">
              {c.capturedTerritories.map(t => {
                const daysLeft = t.status === 'occupied'
                  ? Math.max(0, OCCUPATION_DAYS - (gameState.gameDay - t.capturedOnDay))
                  : 0;
                return (
                  <div key={t.id} className="territory-item">
                    <span>{t.name}</span>
                    <span className={`status-badge ${t.status}`}>{t.status}</span>
                    <span>Day {t.capturedOnDay}</span>
                    {t.status === 'occupied' && (
                      <span className="text-muted">
                        {daysLeft > 0 ? `${daysLeft}d left` : 'auto-integrating'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {c.territoryCaptureHistory.length > 0 && (
            <div className="capture-history">
              <h4>Capture History</h4>
              {c.territoryCaptureHistory.map((entry, i) => (
                <div key={i} className="capture-entry">
                  <span>Day {entry.day}</span>
                  <span>{entry.territories.map(t => t.name).join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="detail-section">
          <h3>BATTLES ({c.battles.length})</h3>
          {gameState.allBattles.filter(b => b.attackerId === c.id || b.defenderId === c.id).length > 0 && (
            <div className="battle-list">
              {gameState.allBattles
                .filter(b => b.attackerId === c.id || b.defenderId === c.id)
                .sort((a, b) => a.day - b.day)
                .map(b => (
                  <div key={b.id} className="battle-item">
                    <span>Day {b.day}</span>
                    <span>{allCountries[b.attackerId]?.name || '???'} vs {allCountries[b.defenderId]?.name || '???'}</span>
                    <span>{b.target}</span>
                    <span className={b.winner === c.id ? 'text-success' : 'text-danger'}>
                      {b.winner === c.id ? 'WON' : 'LOST'}
                    </span>
                    <span>EP: {b.attackerEffectivePower} vs {b.defenderEffectivePower}</span>
                    {b.territoryCaptured && <span className="text-accent">+Terr: {b.territoryName}</span>}
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="detail-section">
          <h3>DIPLOMACY</h3>
          <div className="field-row">
            <span className="field-label">Alliances</span>
            <span className="field-value">{c.alliances.length === 0 ? 'None' : c.alliances.join(', ')}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Treaties</span>
            <span className="field-value">{c.treaties.length === 0 ? 'None' : c.treaties.join(', ')}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Wars</span>
            <span className="field-value">
              {c.wars.length === 0 ? 'None' : c.wars.map(wid => {
                const war = gameState.wars[wid];
                return war ? war.name : wid;
              }).join(', ')}
            </span>
          </div>
        </section>

        <section className="detail-section">
          <h3>NOTES</h3>
          <div className="notes-list">
            {c.notes.map(note => (
              <div key={note.id} className="note-item">
                <span className="note-day">Day {note.day}</span>
                <span className="note-text">{note.text}</span>
              </div>
            ))}
          </div>
          {c.notes.length === 0 && <p className="text-muted">No notes.</p>}
        </section>
      </div>
    </div>
  );
}

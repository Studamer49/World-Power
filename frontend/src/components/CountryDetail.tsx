import { useState } from 'react';
import { Country, GameState } from '../types';
import { useGameStore } from '../context/GameContext';
import { formatMoney, calculateMilitaryPower, getEffectiveValue, generateId } from '../utils/calculations';
import { getFlagEmoji } from '../data/flags';
import { RESEARCH_TIERS, getResearchTierForGDP, ECONOMIC_INVESTMENT_COST, ECONOMIC_INVESTMENT_GDP_GAIN, ECONOMIC_INVESTMENT_GDP_CAP, OCCUPIED_MONEY_INCOME, OCCUPIED_MP_INCOME, INTEGRATED_MONEY_INCOME, INTEGRATED_MP_INCOME, OCCUPATION_DAYS } from '../data/research';
import { ALL_UNIT_IDS, UNIT_NAMES, getUnitRatio } from '../data/militaryUnits';

type Props = {
  country: Country;
  allCountries: Record<string, Country>;
  gameState: GameState;
  onBack: () => void;
};

export default function CountryDetail({ country, allCountries, gameState, onBack }: Props) {
  const { dispatch } = useGameStore();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newNote, setNewNote] = useState('');
  const [confirmDead, setConfirmDead] = useState(false);
  const [confirmRevive, setConfirmRevive] = useState(false);
  const [editingInventory, setEditingInventory] = useState(false);
  const [invEdits, setInvEdits] = useState<Record<string, { mp: number; tier: number }>>({});
  const [renamingTerritory, setRenamingTerritory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const c = country;
  const config = gameState.militaryConfig;

  const moneyVal = getEffectiveValue(c.money, c.manualOverrides, 'money');
  const mpVal = getEffectiveValue(c.mp, c.manualOverrides, 'mp');
  const gdpVal = getEffectiveValue(c.gdp, c.manualOverrides, 'gdp');
  const dailyIncomeVal = getEffectiveValue(c.dailyIncome, c.manualOverrides, 'dailyIncome');
  const dailyMPVal = getEffectiveValue(c.dailyMP, c.manualOverrides, 'dailyMP');
  const milPower = calculateMilitaryPower(c, config);

  const occupiedTerrCount = c.capturedTerritories.filter(t => t.status === 'occupied').length;
  const integratedTerrCount = c.capturedTerritories.filter(t => t.status === 'integrated').length;
  const territoryIncome = occupiedTerrCount * OCCUPIED_MONEY_INCOME + integratedTerrCount * INTEGRATED_MONEY_INCOME;

  const effectiveDailyIncome = dailyIncomeVal.value + territoryIncome;

  const autoTier = getResearchTierForGDP(c.gdp);
  const effectiveTier = autoTier;
  const investmentGDP = c.investmentGDP || 0;
  const canInvest = investmentGDP < ECONOMIC_INVESTMENT_GDP_CAP && c.money >= ECONOMIC_INVESTMENT_COST;

  const startEdit = (field: string, current: string | number) => {
    setEditingField(field);
    setEditValue(String(current));
  };

  const saveEdit = (field: string) => {
    const numVal = parseFloat(editValue);
    if (field === 'name' || field === 'playerName' || field === 'leaderName' || field === 'governmentName' || field === 'dateCreated') {
      dispatch({ type: 'UPDATE_COUNTRY', payload: { id: c.id, updates: { [field]: editValue } } });
    } else if (!isNaN(numVal)) {
      dispatch({ type: 'UPDATE_COUNTRY', payload: { id: c.id, updates: { [field]: numVal } } });
    }
    setEditingField(null);
  };

  const resetOverride = (field: string) => {
    dispatch({ type: 'RESET_MANUAL_OVERRIDE', payload: { countryId: c.id, field: field as any } } as any);
  };

  const toggleDead = () => {
    if (c.alive) {
      dispatch({ type: 'DECLARE_DEAD', payload: c.id });
    } else {
      dispatch({ type: 'REVIVE_COUNTRY', payload: c.id });
    }
    setConfirmDead(false);
    setConfirmRevive(false);
  };

  const startEditInventory = () => {
    const edits: Record<string, { mp: number; tier: number }> = {};
    for (const unitId of ALL_UNIT_IDS) {
      const slot = c.unitInventory?.[unitId as keyof typeof c.unitInventory] || { mp: 0, tier: 1 };
      edits[unitId] = { mp: slot.mp, tier: slot.tier };
    }
    setInvEdits(edits);
    setEditingInventory(true);
  };

  const saveInventory = () => {
    for (const [unitType, vals] of Object.entries(invEdits)) {
      dispatch({
        type: 'UPDATE_UNIT_INVENTORY',
        payload: { countryId: c.id, unitType, mp: vals.mp, tier: vals.tier },
      });
    }
    setEditingInventory(false);
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    dispatch({
      type: 'ADD_NOTE',
      payload: {
        countryId: c.id,
        note: { id: generateId(), text: newNote, day: gameState.gameDay, date: gameState.gameDate },
      },
    });
    setNewNote('');
  };

  const deleteNote = (noteId: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: { countryId: c.id, noteId } });
  };

  const investEconomy = () => {
    if (c.money < ECONOMIC_INVESTMENT_COST) return;
    if (investmentGDP >= ECONOMIC_INVESTMENT_GDP_CAP) return;
    if (!window.confirm(`Invest ${ECONOMIC_INVESTMENT_COST.toLocaleString()} money for +${ECONOMIC_INVESTMENT_GDP_GAIN} GDP?`)) return;
    dispatch({ type: 'INVEST_ECONOMY', payload: { countryId: c.id, cost: ECONOMIC_INVESTMENT_COST, gdpGain: ECONOMIC_INVESTMENT_GDP_GAIN } });
  };

  const renderEditable = (label: string, field: string, value: any, overridden: boolean, type: string = 'number') => {
    const isEditing = editingField === field;
    return (
      <div className="field-row">
        <span className="field-label">{label}</span>
        {isEditing ? (
          <span className="field-edit-group">
            <input
              type={type}
              className="input-sm"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveEdit(field)}
              autoFocus
            />
            <button className="btn btn-xs" onClick={() => saveEdit(field)}>OK</button>
            <button className="btn btn-xs btn-ghost" onClick={() => setEditingField(null)}>X</button>
          </span>
        ) : (
          <span className="field-value-group">
            <span className="field-value clickable" onClick={() => startEdit(field, value)}>
              {typeof value === 'number' ? formatMoney(value) : (value || '\u2014')}
            </span>
            {overridden && <span className="manual-badge">MANUAL</span>}
            <button className="btn btn-xs btn-ghost" onClick={() => startEdit(field, value)}>edit</button>
            {overridden && (
              <button className="btn btn-xs btn-warning" onClick={() => resetOverride(field)}>RESET TO CALC</button>
            )}
          </span>
        )}
      </div>
    );
  };

  const inventory = c.unitInventory || {};

  return (
    <div className="country-detail">
      <div className="detail-header">
        <button className="btn btn-sm" onClick={onBack}>&larr; BACK</button>
        <span className="detail-title">{c.flag} {c.name}</span>
        <span className={`status-badge ${c.alive ? 'alive' : 'dead'}`}>{c.alive ? 'ALIVE' : 'DEAD'}</span>
        {!c.alive ? (
          confirmRevive ? (
            <span>
              <button className="btn btn-sm btn-success" onClick={toggleDead}>CONFIRM REVIVE</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmRevive(false)}>CANCEL</button>
            </span>
          ) : (
            <button className="btn btn-sm btn-success" onClick={() => setConfirmRevive(true)}>REVIVE COUNTRY</button>
          )
        ) : (
          confirmDead ? (
            <span>
              <button className="btn btn-sm btn-danger" onClick={toggleDead}>CONFIRM DEAD</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDead(false)}>CANCEL</button>
            </span>
          ) : (
            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDead(true)}>DECLARE DEAD</button>
          )
        )}
      </div>

      <div className="detail-grid">
        <section className="detail-section">
          <h3>IDENTITY</h3>
          {renderEditable('Country Name', 'name', c.name, false, 'text')}
          {renderEditable('Player', 'playerName', c.playerName, false, 'text')}
          {renderEditable('Leader', 'leaderName', c.leaderName, false, 'text')}
          {renderEditable('Government', 'governmentName', c.governmentName, false, 'text')}
          {renderEditable('Date Created', 'dateCreated', c.dateCreated, false, 'text')}
        </section>

        <section className="detail-section">
          <h3>ECONOMY</h3>
          {renderEditable('Money', 'money', moneyVal.value, moneyVal.overridden)}
          {renderEditable('Daily Income', 'dailyIncome', dailyIncomeVal.value, dailyIncomeVal.overridden)}
          <div className="field-row">
            <span className="field-label">Occupied Terr Income</span>
            <span className="field-value">
              +{formatMoney(c.capturedTerritories.filter(t => t.status === 'occupied').length * OCCUPIED_MONEY_INCOME)}/day
              <span className="text-muted"> ({c.capturedTerritories.filter(t => t.status === 'occupied').length} terrs)</span>
            </span>
          </div>
          <div className="field-row">
            <span className="field-label">Integrated Terr Income</span>
            <span className="field-value">
              +{formatMoney(c.capturedTerritories.filter(t => t.status === 'integrated').length * INTEGRATED_MONEY_INCOME)}/day
              <span className="text-muted"> ({c.capturedTerritories.filter(t => t.status === 'integrated').length} terrs)</span>
            </span>
          </div>
          <div className="field-row">
            <span className="field-label">Total Daily Income</span>
            <span className="field-value"><strong>{formatMoney(effectiveDailyIncome)}</strong></span>
          </div>
          {renderEditable('GDP', 'gdp', gdpVal.value, gdpVal.overridden)}
          <div className="field-row">
            <span className="field-label">Investment GDP</span>
            <span className="field-value">{investmentGDP} / {ECONOMIC_INVESTMENT_GDP_CAP}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Econ Investment</span>
            <button
              className={`btn btn-xs ${canInvest ? 'btn-success' : ''}`}
              disabled={!canInvest}
              onClick={investEconomy}
            >
              INVEST {formatMoney(ECONOMIC_INVESTMENT_COST)} for +{ECONOMIC_INVESTMENT_GDP_GAIN} GDP
            </button>
          </div>
        </section>

        <section className="detail-section full-width">
          <h3>MILITARY</h3>
          <div className="mil-summary">
            {renderEditable('MP', 'mp', mpVal.value, mpVal.overridden)}
            {renderEditable('Daily MP', 'dailyMP', dailyMPVal.value, dailyMPVal.overridden)}
            <div className="field-row">
              <span className="field-label">Total Effective Power</span>
              <span className="field-value"><strong>{formatMoney(milPower)}</strong></span>
            </div>
          </div>

          <h4>UNIT INVENTORY</h4>
          {!editingInventory ? (
            <>
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
              <button className="btn btn-sm" onClick={startEditInventory}>EDIT INVENTORY</button>
            </>
          ) : (
            <div className="inventory-edit">
              {ALL_UNIT_IDS.map(unitId => (
                <div key={unitId} className="inv-edit-row">
                  <span className="unit-label">{UNIT_NAMES[unitId]}</span>
                  <select className="input-sm tier-select" value={invEdits[unitId]?.tier || 1}
                    onChange={e => setInvEdits({ ...invEdits, [unitId]: { ...invEdits[unitId], tier: parseInt(e.target.value) } })}>
                    {[1, 2, 3, 4, 5].map(t => <option key={t} value={t}>T{t}</option>)}
                  </select>
                  <input type="number" className="input-sm mp-input" placeholder="MP"
                    value={invEdits[unitId]?.mp || 0}
                    onChange={e => setInvEdits({ ...invEdits, [unitId]: { ...invEdits[unitId], mp: parseInt(e.target.value) || 0 } })} />
                  <span className="text-muted">
                    Ratio: {getUnitRatio(config, unitId, invEdits[unitId]?.tier || 1).toFixed(2)} |
                    EP: {Math.round((invEdits[unitId]?.mp || 0) * getUnitRatio(config, unitId, invEdits[unitId]?.tier || 1))}
                  </span>
                </div>
              ))}
              <button className="btn btn-sm btn-success" onClick={saveInventory}>SAVE</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setEditingInventory(false)}>CANCEL</button>
            </div>
          )}
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
            <span className="field-value">{c.capturedTerritories.filter(t => t.status === 'occupied').length}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Integrated</span>
            <span className="field-value">{c.capturedTerritories.filter(t => t.status === 'integrated').length}</span>
          </div>
          {c.capturedTerritories.length > 0 && (
            <div className="territory-list">
              {c.capturedTerritories.map(t => {
                const daysLeft = t.status === 'occupied'
                  ? Math.max(0, OCCUPATION_DAYS - (gameState.gameDay - t.capturedOnDay))
                  : 0;
                return (
                  <div key={t.id} className="territory-item">
                    {renamingTerritory === t.id ? (
                      <>
                        <input
                          type="text"
                          className="input-sm"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && renameValue.trim()) {
                              dispatch({ type: 'RENAME_TERRITORY', payload: { countryId: c.id, territoryId: t.id, newName: renameValue.trim() } });
                              setRenamingTerritory(null);
                            }
                          }}
                          autoFocus
                        />
                        <button className="btn btn-xs btn-success" onClick={() => {
                          if (renameValue.trim()) {
                            dispatch({ type: 'RENAME_TERRITORY', payload: { countryId: c.id, territoryId: t.id, newName: renameValue.trim() } });
                            setRenamingTerritory(null);
                          }
                        }}>OK</button>
                        <button className="btn btn-xs btn-ghost" onClick={() => setRenamingTerritory(null)}>X</button>
                      </>
                    ) : (
                      <>
                        <span>{t.name}</span>
                        <span className={`status-badge ${t.status}`}>{t.status}</span>
                        <span>Day {t.capturedOnDay}</span>
                        {t.status === 'occupied' && (
                          <span className="text-muted">
                            {daysLeft > 0 ? `${daysLeft}d left` : 'auto-integrating'}
                          </span>
                        )}
                        {t.status === 'occupied' && (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => dispatch({ type: 'UPDATE_TERRITORY_STATUS', payload: { countryId: c.id, territoryId: t.id, status: 'integrated' } })}
                          >
                            INTEGRATE NOW
                          </button>
                        )}
                        <button
                          className="btn btn-xs"
                          onClick={() => { setRenamingTerritory(t.id); setRenameValue(t.name); }}
                        >
                          RENAME
                        </button>
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={() => { if (window.confirm(`Delete territory "${t.name}"?`)) dispatch({ type: 'DELETE_TERRITORY', payload: { countryId: c.id, territoryId: t.id } }); }}
                        >
                          DELETE
                        </button>
                      </>
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
          <div className="notes-input">
            <input
              type="text"
              className="input-sm"
              placeholder="Add a note..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNote()}
            />
            <button className="btn btn-sm" onClick={addNote}>ADD</button>
          </div>
          <div className="notes-list">
            {c.notes.map(note => (
              <div key={note.id} className="note-item">
                <span className="note-day">Day {note.day}</span>
                <span className="note-text">{note.text}</span>
                <button className="btn btn-xs btn-ghost" onClick={() => deleteNote(note.id)}>X</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

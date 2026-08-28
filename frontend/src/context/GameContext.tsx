import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { GameState, GameAction, Country, Battle, Expense, MoneyChange, MPChange, Territory, TerritoryCaptureHistoryEntry, Note, War, WarScoreEvent, MilitaryConfig, Treaty } from '../types';
import { generateId, advanceDate } from '../utils/calculations';
import { getInitialCountries } from '../data/initialCountries';
import { getDefaultMilitaryConfig } from '../data/militaryUnits';
import { OCCUPIED_MONEY_INCOME, OCCUPIED_MP_INCOME, INTEGRATED_MONEY_INCOME, INTEGRATED_MP_INCOME, OCCUPATION_DAYS } from '../data/research';
import { gameStateApi } from '../api/client';

const STORAGE_KEY = 'world-power-game-state';

function getInitialState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.militaryConfig) parsed.militaryConfig = getDefaultMilitaryConfig();
      if (!parsed.wars) parsed.wars = {};
      if (!parsed.warScoreEvents) parsed.warScoreEvents = [];
      for (const c of Object.values(parsed.countries) as Country[]) {
        if (!c.unitInventory) {
          c.unitInventory = {
            infantry: { mp: c.militaryUnits.infantry || 0, tier: 1 },
            artillery: { mp: c.militaryUnits.artillery || 0, tier: 1 },
            tanks: { mp: c.militaryUnits.tanks || 0, tier: 1 },
            fighterJets: { mp: c.militaryUnits.fighterJets || 0, tier: 1 },
            bombers: { mp: c.militaryUnits.bombers || 0, tier: 1 },
            navalForces: { mp: c.militaryUnits.navalForces || 0, tier: 1 },
            specialForces: { mp: c.militaryUnits.specialForces || 0, tier: 1 },
            airTurrets: { mp: c.militaryUnits.airTurrets || 0, tier: 1 },
          };
        }
        if (!c.militaryUnits.airTurrets && c.militaryUnits.airTurrets !== 0) {
          c.militaryUnits.airTurrets = 0;
        }
        if (c.investmentGDP === undefined) c.investmentGDP = 0;
      }
      if (!parsed.allBattles) parsed.allBattles = [];
      if (!parsed.allExpenses) parsed.allExpenses = [];
      if (!parsed.allMoneyChanges) parsed.allMoneyChanges = [];
      if (!parsed.allMPChanges) parsed.allMPChanges = [];
      if (!parsed.treaties) parsed.treaties = {};
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load saved state:', e);
  }

  const countries: Record<string, Country> = {};
  const initialCountries = getInitialCountries();
  for (const c of initialCountries) {
    countries[c.id] = c;
  }

  return {
    gameDay: 1,
    gameDate: '14 August 2026',
    countries,
    dailySnapshots: {},
    allBattles: [],
    allExpenses: [],
    allMoneyChanges: [],
    allMPChanges: [],
    militaryConfig: getDefaultMilitaryConfig(),
    wars: {},
    warScoreEvents: [],
    treaties: {},
  };
}

export function normalizeLoadedState(parsed: GameState): GameState {
  if (!parsed.militaryConfig) parsed.militaryConfig = getDefaultMilitaryConfig();
  if (!parsed.wars) parsed.wars = {};
  if (!parsed.warScoreEvents) parsed.warScoreEvents = [];
  for (const c of Object.values(parsed.countries) as Country[]) {
    if (!c.unitInventory) {
      c.unitInventory = {
        infantry: { mp: c.militaryUnits?.infantry || 0, tier: 1 },
        artillery: { mp: c.militaryUnits?.artillery || 0, tier: 1 },
        tanks: { mp: c.militaryUnits?.tanks || 0, tier: 1 },
        fighterJets: { mp: c.militaryUnits?.fighterJets || 0, tier: 1 },
        bombers: { mp: c.militaryUnits?.bombers || 0, tier: 1 },
        navalForces: { mp: c.militaryUnits?.navalForces || 0, tier: 1 },
        specialForces: { mp: c.militaryUnits?.specialForces || 0, tier: 1 },
        airTurrets: { mp: c.militaryUnits?.airTurrets || 0, tier: 1 },
      };
    }
    if (!c.militaryUnits) {
      const inv = c.unitInventory as any;
      c.militaryUnits = {
        infantry: inv?.infantry?.mp ?? 0,
        artillery: inv?.artillery?.mp ?? 0,
        tanks: inv?.tanks?.mp ?? 0,
        fighterJets: inv?.fighterJets?.mp ?? 0,
        bombers: inv?.bombers?.mp ?? 0,
        navalForces: inv?.navalForces?.mp ?? 0,
        specialForces: inv?.specialForces?.mp ?? 0,
        airTurrets: inv?.airTurrets?.mp ?? 0,
      };
    }
    if (c.militaryUnits.airTurrets === undefined || c.militaryUnits.airTurrets === null) {
      c.militaryUnits.airTurrets = 0;
    }
    if (c.investmentGDP === undefined) c.investmentGDP = 0;
    if (!c.capturedTerritories) c.capturedTerritories = [];
    if (!c.notes) c.notes = [];
    if (!c.territoryCaptureHistory) c.territoryCaptureHistory = [];
    if (!c.wars) c.wars = [];
    if (!c.battles) c.battles = [];
    if (!c.alliances) c.alliances = [];
    if (!c.treaties) c.treaties = [];
    if (!c.manualOverrides) c.manualOverrides = {};
    if (!c.completedResearch) c.completedResearch = [];
  }
  if (!parsed.allBattles) parsed.allBattles = [];
  if (!parsed.allExpenses) parsed.allExpenses = [];
  if (!parsed.allMoneyChanges) parsed.allMoneyChanges = [];
  if (!parsed.allMPChanges) parsed.allMPChanges = [];
  if (!parsed.treaties) parsed.treaties = {};
  if (!parsed.dailySnapshots) parsed.dailySnapshots = {};
  return parsed;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'NEXT_DAY': {
      const newDay = state.gameDay + 1;
      const newDate = advanceDate(state.gameDate, 1);
      const newCountries = { ...state.countries };
      const growGDP = newDay % 3 === 0;

      const treaties = Object.values(state.treaties || {});

      for (const id of Object.keys(newCountries)) {
        const c = newCountries[id];
        if (!c.alive) continue;

        let moneyGain = c.dailyIncome;
        let mpGain = c.dailyMP;

        const updatedTerritories = c.capturedTerritories.map(t => {
          if (t.status === 'occupied') {
            const daysHeld = newDay - t.capturedOnDay;
            if (daysHeld >= OCCUPATION_DAYS) {
              return { ...t, status: 'integrated' as const, moneyIncome: INTEGRATED_MONEY_INCOME };
            }
            let occMoney = OCCUPIED_MONEY_INCOME;
            let occMP = OCCUPIED_MP_INCOME;
            for (const treaty of treaties) {
              if (treaty.territoryId === t.id && treaty.territoryOwnerId === id) {
                const ownerSplit = treaty.splits.find(s => s.countryId === id);
                if (ownerSplit) {
                  occMoney = Math.round(OCCUPIED_MONEY_INCOME * (ownerSplit.percent / 100));
                  occMP = Math.round(OCCUPIED_MP_INCOME * (ownerSplit.percent / 100));
                }
              }
            }
            moneyGain += occMoney;
            mpGain += occMP;
            return t;
          } else {
            let intMoney = t.moneyIncome > 0 ? t.moneyIncome : INTEGRATED_MONEY_INCOME;
            let intMP = INTEGRATED_MP_INCOME;
            for (const treaty of treaties) {
              if (treaty.territoryId === t.id && treaty.territoryOwnerId === id) {
                const ownerSplit = treaty.splits.find(s => s.countryId === id);
                if (ownerSplit) {
                  intMoney = Math.round(intMoney * (ownerSplit.percent / 100));
                  intMP = Math.round(INTEGRATED_MP_INCOME * (ownerSplit.percent / 100));
                }
              }
            }
            moneyGain += intMoney;
            mpGain += intMP;
            return t;
          }
        });

        for (const treaty of treaties) {
          for (const split of treaty.splits) {
            if (split.countryId === id && split.countryId !== treaty.territoryOwnerId) {
              const ownerCountry = newCountries[treaty.territoryOwnerId];
              if (ownerCountry) {
                const ownerTerr = ownerCountry.capturedTerritories.find(t => t.id === treaty.territoryId);
                if (ownerTerr) {
                  const baseIncome = ownerTerr.status === 'integrated'
                    ? (ownerTerr.moneyIncome > 0 ? ownerTerr.moneyIncome : INTEGRATED_MONEY_INCOME)
                    : OCCUPIED_MONEY_INCOME;
                  const baseMP = ownerTerr.status === 'integrated' ? INTEGRATED_MP_INCOME : OCCUPIED_MP_INCOME;
                  moneyGain += Math.round(baseIncome * (split.percent / 100));
                  mpGain += Math.round(baseMP * (split.percent / 100));
                }
              }
            }
          }
        }

        const gdpGain = growGDP ? 2 : 0;

        newCountries[id] = {
          ...c,
          money: c.money + moneyGain,
          mp: c.mp + mpGain,
          gdp: c.gdp + gdpGain,
          capturedTerritories: updatedTerritories,
        };
      }
      return { ...state, gameDay: newDay, gameDate: newDate, countries: newCountries };
    }

    case 'SET_GAME_DAY':
      return { ...state, gameDay: action.payload };

    case 'SET_GAME_DATE':
      return { ...state, gameDate: action.payload };

    case 'ADD_COUNTRY':
      return {
        ...state,
        countries: { ...state.countries, [action.payload.id]: action.payload },
      };

    case 'UPDATE_COUNTRY':
      return {
        ...state,
        countries: {
          ...state.countries,
          [action.payload.id]: {
            ...state.countries[action.payload.id],
            ...action.payload.updates,
          },
        },
      };

    case 'DECLARE_DEAD':
      return {
        ...state,
        countries: {
          ...state.countries,
          [action.payload]: {
            ...state.countries[action.payload],
            alive: false,
          },
        },
      };

    case 'REVIVE_COUNTRY':
      return {
        ...state,
        countries: {
          ...state.countries,
          [action.payload]: {
            ...state.countries[action.payload],
            alive: true,
          },
        },
      };

    case 'ADD_EXPENSE':
      return {
        ...state,
        allExpenses: [...state.allExpenses, action.payload],
        countries: {
          ...state.countries,
          [action.payload.countryId]: {
            ...state.countries[action.payload.countryId],
            money: state.countries[action.payload.countryId].money - action.payload.amount,
          },
        },
      };

    case 'DELETE_EXPENSE': {
      const expense = state.allExpenses.find(e => e.id === action.payload);
      if (!expense) return state;
      return {
        ...state,
        allExpenses: state.allExpenses.filter(e => e.id !== action.payload),
        countries: {
          ...state.countries,
          [expense.countryId]: {
            ...state.countries[expense.countryId],
            money: state.countries[expense.countryId].money + expense.amount,
          },
        },
      };
    }

    case 'ADD_BATTLE': {
      const battle = action.payload;
      const newCountries = { ...state.countries };
      if (newCountries[battle.attackerId]) {
        newCountries[battle.attackerId] = {
          ...newCountries[battle.attackerId],
          mp: newCountries[battle.attackerId].mp - battle.mpLostAttacker,
          battles: [...newCountries[battle.attackerId].battles, battle.id],
        };
      }
      if (newCountries[battle.defenderId]) {
        newCountries[battle.defenderId] = {
          ...newCountries[battle.defenderId],
          mp: newCountries[battle.defenderId].mp - battle.mpLostDefender,
          battles: [...newCountries[battle.defenderId].battles, battle.id],
        };
      }
      return {
        ...state,
        allBattles: [...state.allBattles, battle],
        countries: newCountries,
      };
    }

    case 'DELETE_BATTLE': {
      const battle = state.allBattles.find(b => b.id === action.payload);
      if (!battle) return state;
      const newCountries = { ...state.countries };
      if (newCountries[battle.attackerId]) {
        newCountries[battle.attackerId] = {
          ...newCountries[battle.attackerId],
          mp: newCountries[battle.attackerId].mp + battle.mpLostAttacker,
          battles: newCountries[battle.attackerId].battles.filter(id => id !== battle.id),
        };
      }
      if (newCountries[battle.defenderId]) {
        newCountries[battle.defenderId] = {
          ...newCountries[battle.defenderId],
          mp: newCountries[battle.defenderId].mp + battle.mpLostDefender,
          battles: newCountries[battle.defenderId].battles.filter(id => id !== battle.id),
        };
      }
      return {
        ...state,
        allBattles: state.allBattles.filter(b => b.id !== action.payload),
        countries: newCountries,
      };
    }

    case 'ADD_TERRITORY_CAPTURE': {
      const { countryId, territory, historyEntry } = action.payload;
      const c = state.countries[countryId];
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            capturedTerritories: [...c.capturedTerritories, territory],
            territoryCaptureHistory: [...c.territoryCaptureHistory, historyEntry],
          },
        },
      };
    }

    case 'UPDATE_TERRITORY_STATUS': {
      const { countryId, territoryId, status } = action.payload;
      const c = state.countries[countryId];
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            capturedTerritories: c.capturedTerritories.map(t =>
              t.id === territoryId ? { ...t, status } : t
            ),
          },
        },
      };
    }

    case 'RENAME_TERRITORY': {
      const { countryId, territoryId, newName } = action.payload;
      const c = state.countries[countryId];
      const oldName = c.capturedTerritories.find(t => t.id === territoryId)?.name;
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            capturedTerritories: c.capturedTerritories.map(t =>
              t.id === territoryId ? { ...t, name: newName } : t
            ),
            territoryCaptureHistory: oldName
              ? c.territoryCaptureHistory.map(entry => ({
                  ...entry,
                  territories: entry.territories.map(t =>
                    t.name === oldName ? { ...t, name: newName } : t
                  ),
                }))
              : c.territoryCaptureHistory,
          },
        },
      };
    }

    case 'DELETE_TERRITORY': {
      const { countryId, territoryId } = action.payload;
      const c = state.countries[countryId];
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            capturedTerritories: c.capturedTerritories.filter(t => t.id !== territoryId),
          },
        },
      };
    }

    case 'ADD_MONEY_CHANGE':
      return {
        ...state,
        allMoneyChanges: [...state.allMoneyChanges, action.payload],
        countries: {
          ...state.countries,
          [action.payload.countryId]: {
            ...state.countries[action.payload.countryId],
            money: state.countries[action.payload.countryId].money + action.payload.amount,
          },
        },
      };

    case 'DELETE_MONEY_CHANGE': {
      const mc = state.allMoneyChanges.find(m => m.id === action.payload);
      if (!mc) return state;
      return {
        ...state,
        allMoneyChanges: state.allMoneyChanges.filter(m => m.id !== action.payload),
        countries: {
          ...state.countries,
          [mc.countryId]: {
            ...state.countries[mc.countryId],
            money: state.countries[mc.countryId].money - mc.amount,
          },
        },
      };
    }

    case 'ADD_MP_CHANGE':
      return {
        ...state,
        allMPChanges: [...state.allMPChanges, action.payload],
        countries: {
          ...state.countries,
          [action.payload.countryId]: {
            ...state.countries[action.payload.countryId],
            mp: state.countries[action.payload.countryId].mp + action.payload.amount,
          },
        },
      };

    case 'DELETE_MP_CHANGE': {
      const mpc = state.allMPChanges.find(m => m.id === action.payload);
      if (!mpc) return state;
      return {
        ...state,
        allMPChanges: state.allMPChanges.filter(m => m.id !== action.payload),
        countries: {
          ...state.countries,
          [mpc.countryId]: {
            ...state.countries[mpc.countryId],
            mp: state.countries[mpc.countryId].mp - mpc.amount,
          },
        },
      };
    }

    case 'ADD_SNAPSHOT': {
      const { day, snapshot } = action.payload;
      const existing = state.dailySnapshots[day] || [];
      return {
        ...state,
        dailySnapshots: {
          ...state.dailySnapshots,
          [day]: [...existing, snapshot],
        },
      };
    }

    case 'APPLY_MANUAL_OVERRIDE': {
      const { countryId, overrides } = action.payload;
      const c = state.countries[countryId];
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            manualOverrides: { ...c.manualOverrides, ...overrides },
          },
        },
      };
    }

    case 'RESET_MANUAL_OVERRIDE': {
      const { countryId, field } = action.payload;
      const c = state.countries[countryId];
      const newOverrides = { ...c.manualOverrides };
      delete newOverrides[field];
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            manualOverrides: newOverrides,
          },
        },
      };
    }

    case 'ADD_NOTE': {
      const { countryId, note } = action.payload;
      const c = state.countries[countryId];
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            notes: [...c.notes, note],
          },
        },
      };
    }

    case 'DELETE_NOTE': {
      const { countryId, noteId } = action.payload;
      const c = state.countries[countryId];
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            notes: c.notes.filter(n => n.id !== noteId),
          },
        },
      };
    }

    // ===== MILITARY CONFIG =====

    case 'UPDATE_MILITARY_CONFIG':
      return {
        ...state,
        militaryConfig: { ...state.militaryConfig, ...action.payload },
      };

    case 'UPDATE_UNIT_RATIO': {
      const { unitId, tier, ratio } = action.payload;
      const config = { ...state.militaryConfig };
      const unitConfigs = { ...config.unitConfigs };
      const unit = { ...unitConfigs[unitId] };
      const tierRatios = [...unit.tierRatios];
      tierRatios[tier - 1] = ratio;
      unit.tierRatios = tierRatios;
      unitConfigs[unitId] = unit;
      return { ...state, militaryConfig: { ...config, unitConfigs } };
    }

    case 'UPDATE_MATCHUP': {
      const { index, modifier } = action.payload;
      const matchups = [...state.militaryConfig.matchups];
      matchups[index] = { ...matchups[index], modifier };
      return { ...state, militaryConfig: { ...state.militaryConfig, matchups } };
    }

    case 'ADD_MATCHUP':
      return {
        ...state,
        militaryConfig: {
          ...state.militaryConfig,
          matchups: [...state.militaryConfig.matchups, action.payload],
        },
      };

    case 'DELETE_MATCHUP': {
      const matchups = [...state.militaryConfig.matchups];
      matchups.splice(action.payload, 1);
      return { ...state, militaryConfig: { ...state.militaryConfig, matchups } };
    }

    case 'RESET_MILITARY_CONFIG':
      return { ...state, militaryConfig: getDefaultMilitaryConfig() };

    // ===== WARS =====

    case 'ADD_WAR':
      return {
        ...state,
        wars: { ...state.wars, [action.payload.id]: action.payload },
      };

    case 'UPDATE_WAR':
      return {
        ...state,
        wars: {
          ...state.wars,
          [action.payload.id]: {
            ...state.wars[action.payload.id],
            ...action.payload.updates,
          },
        },
      };

    case 'ADD_BATTLE_TO_WAR': {
      const { warId, battleId } = action.payload;
      const war = state.wars[warId];
      if (!war) return state;
      return {
        ...state,
        wars: {
          ...state.wars,
          [warId]: {
            ...war,
            battles: [...war.battles, battleId],
          },
        },
      };
    }

    case 'ADD_WAR_SCORE_EVENT': {
      return { ...state, warScoreEvents: [...state.warScoreEvents, action.payload] };
    }

    case 'DELETE_WAR': {
      const newWars = { ...state.wars };
      delete newWars[action.payload];
      return { ...state, wars: newWars };
    }

    // ===== UNIT INVENTORY =====

    case 'UPDATE_UNIT_INVENTORY': {
      const { countryId, unitType, mp, tier } = action.payload;
      const c = state.countries[countryId];
      if (!c) return state;
      const unitInventory = { ...c.unitInventory };
      unitInventory[unitType as keyof typeof unitInventory] = { mp, tier };
      const militaryUnits = { ...c.militaryUnits };
      militaryUnits[unitType as keyof typeof militaryUnits] = mp;
      return {
        ...state,
        countries: {
          ...state.countries,
          [countryId]: { ...c, unitInventory, militaryUnits },
        },
      };
    }

    case 'INVEST_ECONOMY': {
      const { countryId, cost, gdpGain } = action.payload;
      const c = state.countries[countryId];
      if (!c || c.money < cost) return state;
      const currentInvested = c.investmentGDP || 0;
      if (currentInvested >= 5) return state;
      const actualGain = Math.min(gdpGain, 5 - currentInvested);
      const expense: Expense = {
        id: generateId(),
        day: state.gameDay,
        date: state.gameDate,
        countryId,
        amount: cost,
        category: 'Diplomacy',
        description: `Economic Investment (+${actualGain} GDP)`,
      };
      return {
        ...state,
        allExpenses: [...state.allExpenses, expense],
        countries: {
          ...state.countries,
          [countryId]: {
            ...c,
            money: c.money - cost,
            gdp: c.gdp + actualGain,
            investmentGDP: currentInvested + actualGain,
          },
        },
      };
    }

    // ===== TREATIES =====

    case 'ADD_TREATY':
      return {
        ...state,
        treaties: { ...state.treaties, [action.payload.id]: action.payload },
      };

    case 'UPDATE_TREATY':
      return {
        ...state,
        treaties: {
          ...state.treaties,
          [action.payload.id]: {
            ...state.treaties[action.payload.id],
            ...action.payload.updates,
          },
        },
      };

    case 'DELETE_TREATY': {
      const newTreaties = { ...state.treaties };
      delete newTreaties[action.payload];
      return { ...state, treaties: newTreaties };
    }

    default:
      return state;
  }
}

type GameContextType = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  saveStatus: 'saved' | 'saving';
  forceSave: () => void;
  loading: boolean;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootstrapped = useRef(false);

  // Load game state from the database on mount (single source of truth)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await gameStateApi.get();
        if (cancelled) return;
        if (data) {
          const payload = normalizeLoadedState(data);
          dispatch({ type: 'LOAD_STATE', payload });
        }
      } catch (e) {
        console.error('Failed to load game state from DB:', e);
      } finally {
        if (!cancelled) {
          bootstrapped.current = true;
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist game state to the DB and localStorage cache after changes
  useEffect(() => {
    if (!bootstrapped.current) return;
    setSaveStatus('saving');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save state to localStorage:', e);
      }
      gameStateApi.save(state)
        .then(() => setSaveStatus('saved'))
        .catch((e) => {
          console.error('Failed to save game state to DB:', e);
          setSaveStatus('saved');
        });
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state]);

  const forceSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to force save to localStorage:', e);
    }
    gameStateApi.save(state)
      .then(() => setSaveStatus('saved'))
      .catch((e) => {
        console.error('Failed to force save to DB:', e);
        setSaveStatus('saved');
      });
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch, saveStatus, forceSave, loading }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameStore must be used within GameProvider');
  return context;
}

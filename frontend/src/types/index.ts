export type MilitaryUnits = {
  infantry: number;
  artillery: number;
  tanks: number;
  fighterJets: number;
  bombers: number;
  navalForces: number;
  specialForces: number;
  airTurrets: number;
};

export type UnitInventory = {
  [K in keyof MilitaryUnits]: {
    mp: number;
    tier: number;
  };
};

export type Territory = {
  id: string;
  name: string;
  owner: string;
  capturingCountryId: string;
  capturedOnDay: number;
  capturedOnDate: string;
  status: 'occupied' | 'integrated';
  moneyIncome: number;
};

export type TerritoryCaptureHistoryEntry = {
  day: number;
  date: string;
  territories: { name: string; fromCountryId: string }[];
};

export type BattleUnit = {
  unitType: string;
  tier: number;
  mpCommitted: number;
  ratio: number;
  matchupModifier: number;
  effectivePower: number;
};

export type Battle = {
  id: string;
  warId?: string;
  day: number;
  date: string;
  attackerId: string;
  defenderId: string;
  target: string;
  attackerUnits: BattleUnit[];
  defenderUnits: BattleUnit[];
  attackerMP: number;
  defenderMP: number;
  attackerEffectivePower: number;
  defenderEffectivePower: number;
  winner: string;
  result: string;
  mpLostAttacker: number;
  mpLostDefender: number;
  territoryCaptured: boolean;
  territoryName: string;
  notes: string;
};

export type MoneyChange = {
  id: string;
  day: number;
  date: string;
  countryId: string;
  amount: number;
  type: string;
  from: string;
  to: string;
  description: string;
};

export type MPChange = {
  id: string;
  day: number;
  date: string;
  countryId: string;
  amount: number;
  type: string;
  description: string;
};

export type Expense = {
  id: string;
  day: number;
  date: string;
  countryId: string;
  amount: number;
  category: string;
  description: string;
};

export type Note = {
  id: string;
  text: string;
  day: number;
  date: string;
  author?: string;
  isGM?: boolean;
  replyToId?: string | null;
  replies?: Note[];
  createdAt?: string;
};

export type War = {
  id: string;
  name: string;
  attackerIds: string[];
  defenderIds: string[];
  startDate: string;
  startDay: number;
  endDate: string;
  endDay: number;
  status: 'active' | 'truce' | 'ended';
  battles: string[];
  territoriesCaptured: { territory: string; byCountryId: string; day: number }[];
  territoriesLost: { territory: string; fromCountryId: string; day: number }[];
  warScore: Record<string, number>;
  notes: string;
};

export type WarScoreEvent = {
  id: string;
  warId: string;
  countryId: string;
  amount: number;
  reason: string;
  day: number;
  date: string;
};

export type MPEstimateUnit = {
  unitType: string;
  tier: number;
  mp: number;
};

export type Treaty = {
  id: string;
  name: string;
  countryIds: string[];
  territoryId: string;
  territoryOwnerId: string;
  splits: { countryId: string; percent: number }[];
  day: number;
  date: string;
  notes: string;
};

export type ManualOverrides = {
  money?: number;
  mp?: number;
  gdp?: number;
  dailyIncome?: number;
  dailyMP?: number;
  researchTier?: number;
  militaryUnits?: Partial<MilitaryUnits>;
};

export type Country = {
  id: string;
  name: string;
  playerName: string;
  leaderName: string;
  governmentName: string;
  flag: string;
  password?: string;
  alive: boolean;
  dateCreated: string;
  money: number;
  mp: number;
  gdp: number;
  dailyIncome: number;
  dailyMP: number;
  researchTier: number;
  investmentGDP: number;
  completedResearch: string[];
  militaryUnits: MilitaryUnits;
  unitInventory: UnitInventory;
  territories: Territory[];
  capturedTerritories: Territory[];
  territoryCaptureHistory: TerritoryCaptureHistoryEntry[];
  battles: string[];
  wars: string[];
  alliances: string[];
  treaties: string[];
  notes: Note[];
  manualOverrides: ManualOverrides;
};

export type DailySnapshot = {
  gameDay: number;
  date: string;
  countryId: string;
  startingMoney: number;
  moneyChanges: { type: string; amount: number; description: string }[];
  endingMoney: number;
  startingMP: number;
  mpChanges: { type: string; amount: number; description: string }[];
  endingMP: number;
  startingGDP: number;
  endingGDP: number;
  territoryChanges: { type: string; territory: string }[];
  researchChanges: string[];
  militaryChanges: { unit: string; change: number }[];
  notes: string[];
};

export type MilitaryUnitConfig = {
  id: string;
  name: string;
  description: string;
  role: string;
  tierRatios: number[];
  counters: string[];
  counteredBy: string[];
  researchRequirement: string;
  available: boolean;
};

export type MatchupModifier = {
  attackerUnit: string;
  defenderUnit: string;
  modifier: number;
};

export type MilitaryConfig = {
  unitConfigs: Record<string, MilitaryUnitConfig>;
  matchups: MatchupModifier[];
  tierResearchRequirements: Record<number, string>;
};

export type GameState = {
  gameDay: number;
  gameDate: string;
  countries: Record<string, Country>;
  dailySnapshots: Record<number, DailySnapshot[]>;
  allBattles: Battle[];
  allExpenses: Expense[];
  allMoneyChanges: MoneyChange[];
  allMPChanges: MPChange[];
  militaryConfig: MilitaryConfig;
  wars: Record<string, War>;
  warScoreEvents: WarScoreEvent[];
  treaties: Record<string, Treaty>;
};

export type GameAction =
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'NEXT_DAY' }
  | { type: 'SET_GAME_DAY'; payload: number }
  | { type: 'SET_GAME_DATE'; payload: string }
  | { type: 'ADD_COUNTRY'; payload: Country }
  | { type: 'UPDATE_COUNTRY'; payload: { id: string; updates: Partial<Country> } }
  | { type: 'DECLARE_DEAD'; payload: string }
  | { type: 'REVIVE_COUNTRY'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_BATTLE'; payload: Battle }
  | { type: 'DELETE_BATTLE'; payload: string }
  | { type: 'ADD_TERRITORY_CAPTURE'; payload: { countryId: string; territory: Territory; historyEntry: TerritoryCaptureHistoryEntry } }
  | { type: 'UPDATE_TERRITORY_STATUS'; payload: { countryId: string; territoryId: string; status: 'occupied' | 'integrated' } }
  | { type: 'RENAME_TERRITORY'; payload: { countryId: string; territoryId: string; newName: string } }
  | { type: 'DELETE_TERRITORY'; payload: { countryId: string; territoryId: string } }
  | { type: 'ADD_MONEY_CHANGE'; payload: MoneyChange }
  | { type: 'DELETE_MONEY_CHANGE'; payload: string }
  | { type: 'ADD_MP_CHANGE'; payload: MPChange }
  | { type: 'DELETE_MP_CHANGE'; payload: string }
  | { type: 'ADD_SNAPSHOT'; payload: { day: number; snapshot: DailySnapshot } }
  | { type: 'APPLY_MANUAL_OVERRIDE'; payload: { countryId: string; overrides: Partial<ManualOverrides> } }
  | { type: 'RESET_MANUAL_OVERRIDE'; payload: { countryId: string; field: keyof ManualOverrides } }
  | { type: 'ADD_NOTE'; payload: { countryId: string; note: Note } }
  | { type: 'DELETE_NOTE'; payload: { countryId: string; noteId: string } }
  | { type: 'UPDATE_MILITARY_CONFIG'; payload: Partial<MilitaryConfig> }
  | { type: 'UPDATE_UNIT_RATIO'; payload: { unitId: string; tier: number; ratio: number } }
  | { type: 'UPDATE_MATCHUP'; payload: { index: number; modifier: number } }
  | { type: 'ADD_MATCHUP'; payload: MatchupModifier }
  | { type: 'DELETE_MATCHUP'; payload: number }
  | { type: 'RESET_MILITARY_CONFIG' }
  | { type: 'ADD_WAR'; payload: War }
  | { type: 'UPDATE_WAR'; payload: { id: string; updates: Partial<War> } }
  | { type: 'ADD_BATTLE_TO_WAR'; payload: { warId: string; battleId: string } }
  | { type: 'ADD_WAR_SCORE_EVENT'; payload: WarScoreEvent }
  | { type: 'DELETE_WAR'; payload: string }
  | { type: 'UPDATE_UNIT_INVENTORY'; payload: { countryId: string; unitType: string; mp: number; tier: number } }
  | { type: 'INVEST_ECONOMY'; payload: { countryId: string; cost: number; gdpGain: number } }
  | { type: 'ADD_TREATY'; payload: Treaty }
  | { type: 'UPDATE_TREATY'; payload: { id: string; updates: Partial<Treaty> } }
  | { type: 'DELETE_TREATY'; payload: string };

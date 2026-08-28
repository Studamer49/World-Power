import { Country, MilitaryUnits, ManualOverrides, DailySnapshot, Battle, BattleUnit, Expense, MoneyChange, MPChange, MilitaryConfig, UnitInventory, GameState } from '../types';
import { getUnitRatio, getMatchupModifier } from '../data/militaryUnits';
import { getResearchTierForGDP } from '../data/research';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString();
}

export function formatMP(amount: number): string {
  return amount.toLocaleString();
}

export function getEffectiveValue<T extends number>(
  calculated: T,
  overrides: ManualOverrides,
  field: keyof ManualOverrides
): { value: T; overridden: boolean } {
  if (overrides && overrides[field] !== undefined) {
    return { value: overrides[field] as T, overridden: true };
  }
  return { value: calculated, overridden: false };
}

export function calculateDailyIncome(country: Country): { value: number; overridden: boolean } {
  const territoryIncome = country.capturedTerritories
    .filter(t => t.status === 'integrated')
    .reduce((sum, t) => sum + t.moneyIncome, 0);
  const calculated = country.dailyIncome + territoryIncome;
  return getEffectiveValue(calculated, country.manualOverrides, 'dailyIncome');
}

export function calculateMoney(country: Country): { value: number; overridden: boolean } {
  return getEffectiveValue(country.money, country.manualOverrides, 'money');
}

export function calculateMP(country: Country): { value: number; overridden: boolean } {
  return getEffectiveValue(country.mp, country.manualOverrides, 'mp');
}

export function calculateGDP(country: Country): { value: number; overridden: boolean } {
  return getEffectiveValue(country.gdp, country.manualOverrides, 'gdp');
}

export function calculateMilitaryPower(country: Country, config?: MilitaryConfig): number {
  if (config && country.unitInventory) {
    let total = 0;
    for (const [unitType, slot] of Object.entries(country.unitInventory)) {
      if (slot.mp > 0) {
        const ratio = getUnitRatio(config, unitType, slot.tier);
        total += slot.mp * ratio;
      }
    }
    return total;
  }
  const u = country.militaryUnits;
  const base =
    (u.infantry || 0) * 1 +
    (u.artillery || 0) * 5 +
    (u.tanks || 0) * 15 +
    (u.fighterJets || 0) * 20 +
    (u.bombers || 0) * 25 +
    (u.navalForces || 0) * 18 +
    (u.specialForces || 0) * 12 +
    (u.airTurrets || 0) * 10;
  return base;
}

export function getAliveCountries(countries: Record<string, Country>): Country[] {
  return Object.values(countries).filter(c => c.alive);
}

export function getDeadCountries(countries: Record<string, Country>): Country[] {
  return Object.values(countries).filter(c => !c.alive);
}

export function getTotalWorldGDP(countries: Record<string, Country>): number {
  return getAliveCountries(countries).reduce((sum, c) => sum + calculateGDP(c).value, 0);
}

export function getTotalWorldMoney(countries: Record<string, Country>): number {
  return getAliveCountries(countries).reduce((sum, c) => sum + calculateMoney(c).value, 0);
}

export function getTotalWorldMP(countries: Record<string, Country>): number {
  return getAliveCountries(countries).reduce((sum, c) => sum + calculateMP(c).value, 0);
}

export function getTotalCapturedTerritories(countries: Record<string, Country>): number {
  return getAliveCountries(countries).reduce((sum, c) => sum + c.capturedTerritories.length, 0);
}

export function formatDate(dateStr: string): string {
  return dateStr;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function parseDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split(' ');
  if (parts.length < 3) return null;
  const day = parseInt(parts[0]);
  const month = MONTHS.indexOf(parts[1]);
  const year = parseInt(parts[2]);
  if (isNaN(day) || month < 0 || isNaN(year)) return null;
  return new Date(year, month, day);
}

export function formatDateStr(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function advanceDate(dateStr: string, days: number = 1): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  date.setDate(date.getDate() + days);
  return formatDateStr(date);
}

export function dateToInputValue(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function inputValueToDate(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return formatDateStr(date);
}

export function applyMoneyChangesForDay(country: Country, state: { allMoneyChanges: MoneyChange[]; allExpenses: Expense[]; gameDay: number }): { finalMoney: number; breakdown: { label: string; amount: number }[] } {
  const breakdown: { label: string; amount: number }[] = [];
  let money = country.money;

  const territoryIncome = country.capturedTerritories
    .filter(t => t.status === 'integrated')
    .reduce((sum, t) => sum + t.moneyIncome, 0);

  breakdown.push({ label: 'Starting', amount: money });
  breakdown.push({ label: 'Daily Income', amount: country.dailyIncome });
  money += country.dailyIncome;

  if (territoryIncome > 0) {
    breakdown.push({ label: 'Territory Income', amount: territoryIncome });
    money += territoryIncome;
  }

  const dayExpenses = state.allExpenses.filter(e => e.countryId === country.id && e.day === state.gameDay);
  for (const exp of dayExpenses) {
    breakdown.push({ label: `Expense: ${exp.description || exp.category}`, amount: -exp.amount });
    money -= exp.amount;
  }

  const dayReceived = state.allMoneyChanges.filter(m => m.countryId === country.id && m.day === state.gameDay && m.amount > 0);
  for (const mc of dayReceived) {
    breakdown.push({ label: `Received: ${mc.description}`, amount: mc.amount });
    money += mc.amount;
  }

  const daySent = state.allMoneyChanges.filter(m => m.countryId === country.id && m.day === state.gameDay && m.amount < 0);
  for (const mc of daySent) {
    breakdown.push({ label: `Sent: ${mc.description}`, amount: mc.amount });
    money += mc.amount;
  }

  return { finalMoney: money, breakdown };
}

export function applyMPChangesForDay(country: Country, state: { allMPChanges: MPChange[]; allBattles: Battle[]; gameDay: number }): { finalMP: number; breakdown: { label: string; amount: number }[] } {
  const breakdown: { label: string; amount: number }[] = [];
  let mp = country.mp;

  breakdown.push({ label: 'Starting', amount: mp });
  breakdown.push({ label: 'Daily MP', amount: country.dailyMP });
  mp += country.dailyMP;

  const dayBattles = state.allBattles.filter(b =>
    (b.attackerId === country.id || b.defenderId === country.id) && b.day === state.gameDay
  );
  for (const battle of dayBattles) {
    if (battle.attackerId === country.id) {
      breakdown.push({ label: `Battle (attack): ${battle.target}`, amount: -battle.mpLostAttacker });
      mp -= battle.mpLostAttacker;
    } else {
      breakdown.push({ label: `Battle (defend): ${battle.target}`, amount: -battle.mpLostDefender });
      mp -= battle.mpLostDefender;
    }
  }

  const dayMPChanges = state.allMPChanges.filter(m => m.countryId === country.id && m.day === state.gameDay);
  for (const mc of dayMPChanges) {
    breakdown.push({ label: `${mc.type}: ${mc.description}`, amount: mc.amount });
    mp += mc.amount;
  }

  return { finalMP: mp, breakdown };
}

export function createDailySnapshot(country: Country, gameDay: number, date: string, state: any): DailySnapshot {
  const moneyResult = applyMoneyChangesForDay(country, { ...state, gameDay });
  const mpResult = applyMPChangesForDay(country, { ...state, gameDay });

  return {
    gameDay,
    date,
    countryId: country.id,
    startingMoney: country.money,
    moneyChanges: moneyResult.breakdown.map(b => ({ type: b.label, amount: b.amount, description: b.label })),
    endingMoney: moneyResult.finalMoney,
    startingMP: country.mp,
    mpChanges: mpResult.breakdown.map(b => ({ type: b.label, amount: b.amount, description: b.label })),
    endingMP: mpResult.finalMP,
    startingGDP: country.gdp,
    endingGDP: country.gdp,
    territoryChanges: [],
    researchChanges: [],
    militaryChanges: [],
    notes: [],
  };
}

// ===== BATTLE CALCULATOR =====

export type BattleCalcUnit = {
  unitType: string;
  tier: number;
  mp: number;
};

export type BattleCalcSide = {
  countryId: string;
  units: BattleCalcUnit[];
};

export type BattleCalcResult = {
  attackerUnits: BattleUnit[];
  defenderUnits: BattleUnit[];
  attackerTotalMP: number;
  defenderTotalMP: number;
  attackerEffectivePower: number;
  defenderEffectivePower: number;
  winner: string;
  breakdown: string[];
};

export function calculateBattle(
  config: MilitaryConfig,
  attacker: BattleCalcSide,
  defender: BattleCalcSide,
): BattleCalcResult {
  const breakdown: string[] = [];
  const attackerUnits: BattleUnit[] = [];
  const defenderUnits: BattleUnit[] = [];
  let attackerTotalMP = 0;
  let defenderTotalMP = 0;
  let attackerEffectivePower = 0;
  let defenderEffectivePower = 0;

  // Calculate attacker side
  for (const au of attacker.units) {
    if (au.mp <= 0) continue;
    const ratio = getUnitRatio(config, au.unitType, au.tier);

    // Find best matchup against defender's units
    let bestMatchup = 1.0;
    for (const du of defender.units) {
      const m = getMatchupModifier(config, au.unitType, du.unitType);
      if (m > bestMatchup) bestMatchup = m;
    }

    const ep = au.mp * ratio * bestMatchup;
    attackerUnits.push({
      unitType: au.unitType,
      tier: au.tier,
      mpCommitted: au.mp,
      ratio,
      matchupModifier: bestMatchup,
      effectivePower: Math.round(ep),
    });
    attackerTotalMP += au.mp;
    attackerEffectivePower += ep;
    breakdown.push(`ATK ${au.unitType} T${au.tier}: ${au.mp} × ${ratio.toFixed(2)} × ${bestMatchup.toFixed(2)} = ${Math.round(ep)}`);
  }

  // Calculate defender side
  for (const du of defender.units) {
    if (du.mp <= 0) continue;
    const ratio = getUnitRatio(config, du.unitType, du.tier);

    let bestMatchup = 1.0;
    for (const au of attacker.units) {
      const m = getMatchupModifier(config, du.unitType, au.unitType);
      if (m > bestMatchup) bestMatchup = m;
    }

    const ep = du.mp * ratio * bestMatchup;
    defenderUnits.push({
      unitType: du.unitType,
      tier: du.tier,
      mpCommitted: du.mp,
      ratio,
      matchupModifier: bestMatchup,
      effectivePower: Math.round(ep),
    });
    defenderTotalMP += du.mp;
    defenderEffectivePower += ep;
    breakdown.push(`DEF ${du.unitType} T${du.tier}: ${du.mp} × ${ratio.toFixed(2)} × ${bestMatchup.toFixed(2)} = ${Math.round(ep)}`);
  }

  attackerEffectivePower = Math.round(attackerEffectivePower);
  defenderEffectivePower = Math.round(defenderEffectivePower);

  const winner = attackerEffectivePower >= defenderEffectivePower ? 'attacker' : 'defender';

  return {
    attackerUnits,
    defenderUnits,
    attackerTotalMP,
    defenderTotalMP,
    attackerEffectivePower,
    defenderEffectivePower,
    winner,
    breakdown,
  };
}

export function autoDistributeLoss(mpLost: number, units: BattleUnit[]): Record<string, number> {
  const totalEP = units.reduce((sum, u) => sum + u.effectivePower, 0);
  if (totalEP === 0) return {};
  const losses: Record<string, number> = {};
  let remaining = mpLost;
  const sorted = [...units].sort((a, b) => b.effectivePower - a.effectivePower);
  for (let i = 0; i < sorted.length; i++) {
    const u = sorted[i];
    const share = i === sorted.length - 1 ? remaining : Math.round(mpLost * (u.mpCommitted / units.reduce((s, x) => s + x.mpCommitted, 0)));
    losses[u.unitType] = Math.min(share, u.mpCommitted);
    remaining -= losses[u.unitType];
  }
  return losses;
}

export function getCountryTotalMPEstimate(country: Country, config: MilitaryConfig): { unitType: string; tier: number; mp: number; ratio: number; ep: number }[] {
  const result: { unitType: string; tier: number; mp: number; ratio: number; ep: number }[] = [];
  if (!country.unitInventory) return result;
  for (const [unitType, slot] of Object.entries(country.unitInventory)) {
    if (slot.mp > 0) {
      const ratio = getUnitRatio(config, unitType, slot.tier);
      result.push({
        unitType,
        tier: slot.tier,
        mp: slot.mp,
        ratio,
        ep: Math.round(slot.mp * ratio),
      });
    }
  }
  return result;
}

export function generateNotebookText(
  gameDay: number,
  gameDate: string,
  countries: Record<string, Country>,
  allBattles: Battle[],
  allExpenses: Expense[],
  allMoneyChanges: MoneyChange[],
  allMPChanges: MPChange[]
): string {
  const lines: string[] = [];
  const dateShort = gameDate.replace(/\d{4}$/, () => "'" + gameDate.slice(-2));

  lines.push(`DAY ${gameDay} \u2014 ${dateShort}`);
  lines.push('');

  const alive = Object.values(countries).filter(c => c.alive).sort((a, b) => a.name.localeCompare(b.name));

  for (const c of alive) {
    const dailyIncome = c.dailyIncome;
    const territoryIncome = c.capturedTerritories
      .filter(t => t.status === 'integrated')
      .reduce((sum, t) => sum + t.moneyIncome, 0);

    const dayExpenses = allExpenses.filter(e => e.countryId === c.id && e.day === gameDay);
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const dayMoneyIn = allMoneyChanges.filter(m => m.countryId === c.id && m.day === gameDay && m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
    const dayMoneyOut = allMoneyChanges.filter(m => m.countryId === c.id && m.day === gameDay && m.amount < 0).reduce((sum, m) => sum + Math.abs(m.amount), 0);

    const newMoney = c.money + dailyIncome + territoryIncome - totalExpenses + dayMoneyIn - dayMoneyOut;

    const dayMPIn = allMPChanges.filter(m => m.countryId === c.id && m.day === gameDay && m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
    const dayMPOut = allMPChanges.filter(m => m.countryId === c.id && m.day === gameDay && m.amount < 0).reduce((sum, m) => sum + Math.abs(m.amount), 0);

    const dayBattles = allBattles.filter(b =>
      (b.attackerId === c.id || b.defenderId === c.id) && b.day === gameDay
    );
    const battleMPLoss = dayBattles.reduce((sum, b) => {
      return sum + (b.attackerId === c.id ? b.mpLostAttacker : b.mpLostDefender);
    }, 0);

    const newMP = c.mp + c.dailyMP + dayMPIn - battleMPLoss - dayMPOut;

    const terrCount = c.capturedTerritories.length;
    const nameStr = c.playerName ? `${c.name} \u2014 ${c.playerName}` : c.name;

    let moneyStr = `M: ${formatMoney(c.money)}`;
    const changes: string[] = [];
    if (dailyIncome > 0) changes.push(`+${formatMoney(dailyIncome)}`);
    if (territoryIncome > 0) changes.push(`+${formatMoney(territoryIncome)}`);
    if (totalExpenses > 0) changes.push(`-${formatMoney(totalExpenses)}`);
    if (dayMoneyIn > 0) changes.push(`+${formatMoney(dayMoneyIn)}`);
    if (dayMoneyOut > 0) changes.push(`-${formatMoney(dayMoneyOut)}`);
    if (changes.length > 0) moneyStr += ' ' + changes.join(' ') + ` = ${formatMoney(newMoney)}`;
    else moneyStr += ` = ${formatMoney(newMoney)}`;

    let mpStr = `MP: ${formatMP(c.mp)}`;
    const mpChanges: string[] = [];
    if (c.dailyMP > 0) mpChanges.push(`+${formatMP(c.dailyMP)}`);
    if (battleMPLoss > 0) mpChanges.push(`-${formatMP(battleMPLoss)}`);
    if (dayMPIn > 0) mpChanges.push(`+${formatMP(dayMPIn)}`);
    if (dayMPOut > 0) mpChanges.push(`-${formatMP(dayMPOut)}`);
    if (mpChanges.length > 0) mpStr += ' ' + mpChanges.join(' ') + ` = ${formatMP(newMP)}`;
    else mpStr += ` = ${formatMP(newMP)}`;

    lines.push(`${nameStr}`);
    lines.push(`  ${moneyStr}`);
    lines.push(`  ${mpStr}`);
    lines.push(`  Terr: ${terrCount} | GDP: ${c.gdp} | Res: T${getResearchTierForGDP(c.gdp)}`);
    lines.push('');
  }

  return lines.join('\n');
}

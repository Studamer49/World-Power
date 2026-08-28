import { GameState } from '../types';
import { formatMoney, formatMP, calculateDailyIncome } from '../utils/calculations';
import { OCCUPIED_MONEY_INCOME, INTEGRATED_MONEY_INCOME, OCCUPIED_MP_INCOME, INTEGRATED_MP_INCOME, getResearchTierForGDP } from '../data/research';

type Props = { gameState: GameState; onClose: () => void };

export default function DailyUpdate({ gameState, onClose }: Props) {
  const alive = Object.values(gameState.countries).filter(c => c.alive).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>DAILY UPDATE — Day {gameState.gameDay} — {gameState.gameDate}</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>
        <div className="daily-update-list">
          {alive.map(c => {
            const dailyIncome = calculateDailyIncome(c);
            const occCount = c.capturedTerritories.filter(t => t.status === 'occupied').length;
            const intCount = c.capturedTerritories.filter(t => t.status === 'integrated').length;
            const territoryIncome = occCount * OCCUPIED_MONEY_INCOME + intCount * INTEGRATED_MONEY_INCOME;
            const territoryMP = occCount * OCCUPIED_MP_INCOME + intCount * INTEGRATED_MP_INCOME;
            const dayExpenses = gameState.allExpenses.filter(e => e.countryId === c.id && e.day === gameState.gameDay);
            const totalExpenses = dayExpenses.reduce((s, e) => s + e.amount, 0);
            const dayMPLoss = gameState.allBattles
              .filter(b => (b.attackerId === c.id || b.defenderId === c.id) && b.day === gameState.gameDay)
              .reduce((s, b) => s + (b.attackerId === c.id ? b.mpLostAttacker : b.mpLostDefender), 0);

            const newMoney = c.money + dailyIncome.value + territoryIncome - totalExpenses;
            const newMP = c.mp + c.dailyMP + territoryMP - dayMPLoss;

            return (
              <div key={c.id} className="daily-update-card">
                <h4>{c.flag} {c.name}</h4>
                <div className="du-row">
                  <span>MONEY: {formatMoney(c.money)}</span>
                  <span>+{formatMoney(dailyIncome.value)} income</span>
                  {territoryIncome > 0 && <span>+{formatMoney(territoryIncome)} territory</span>}
                  {totalExpenses > 0 && <span>-{formatMoney(totalExpenses)} expenses</span>}
                  <span>= <strong>{formatMoney(newMoney)}</strong></span>
                </div>
                <div className="du-row">
                  <span>MP: {formatMP(c.mp)}</span>
                  <span>+{formatMP(c.dailyMP)} daily</span>
                  {territoryMP > 0 && <span>+{formatMP(territoryMP)} territory</span>}
                  {dayMPLoss > 0 && <span>-{formatMP(dayMPLoss)} battle</span>}
                  <span>= <strong>{formatMP(newMP)}</strong></span>
                </div>
                <div className="du-row">
                  <span>Terr: {c.capturedTerritories.length}</span>
                  <span>GDP: {c.gdp}</span>
                  <span>Res: T{getResearchTierForGDP(c.gdp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

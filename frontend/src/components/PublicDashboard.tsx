import { useState } from 'react';
import { GameState, Country } from '../types';
import {
  getAliveCountries,
  getDeadCountries,
  getTotalWorldGDP,
  getTotalWorldMoney,
  getTotalWorldMP,
  getTotalCapturedTerritories,
  formatMoney,
  calculateGDP,
} from '../utils/calculations';
import { getFlagEmoji } from '../data/flags';
import { OCCUPIED_MONEY_INCOME, INTEGRATED_MONEY_INCOME, getResearchTierForGDP } from '../data/research';

type Props = {
  gameState: GameState;
  onSelectCountry: (id: string) => void;
};

type SortKey = 'name' | 'gdp' | 'money' | 'mp' | 'dailyIncome' | 'territories' | 'researchTier';
type FilterKey = 'all' | 'alive' | 'dead';

export default function PublicDashboard({ gameState, onSelectCountry }: Props) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  const aliveCountries = getAliveCountries(gameState.countries);
  const deadCountries = getDeadCountries(gameState.countries);
  const totalGDP = getTotalWorldGDP(gameState.countries);
  const totalMoney = getTotalWorldMoney(gameState.countries);
  const totalMP = getTotalWorldMP(gameState.countries);
  const totalTerritories = getTotalCapturedTerritories(gameState.countries);
  const totalBattles = gameState.allBattles.length;
  const totalDailyIncome = aliveCountries.reduce((sum, c) => {
    const occCount = c.capturedTerritories.filter(t => t.status === 'occupied').length;
    const intCount = c.capturedTerritories.filter(t => t.status === 'integrated').length;
    return sum + c.dailyIncome + occCount * OCCUPIED_MONEY_INCOME + intCount * INTEGRATED_MONEY_INCOME;
  }, 0);

  const allCountries = [...aliveCountries, ...deadCountries];

  let filtered = allCountries.filter(c => {
    if (filter === 'alive' && !c.alive) return false;
    if (filter === 'dead' && c.alive) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        c.playerName.toLowerCase().includes(s) ||
        c.leaderName.toLowerCase().includes(s)
      );
    }
    return true;
  });

  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'gdp': cmp = calculateGDP(a).value - calculateGDP(b).value; break;
      case 'money': cmp = a.money - b.money; break;
      case 'mp': cmp = a.mp - b.mp; break;
      case 'dailyIncome': cmp = a.dailyIncome - b.dailyIncome; break;
      case 'territories': cmp = a.capturedTerritories.length - b.capturedTerritories.length; break;
      case 'researchTier': cmp = getResearchTierForGDP(a.gdp) - getResearchTierForGDP(b.gdp); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(true); }
  };

  const sortIndicator = (key: SortKey) => sortBy === key ? (sortAsc ? ' \u25B2' : ' \u25BC') : '';

  return (
    <div className="dashboard">
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Game Day</span>
          <span className="stat-value">{gameState.gameDay}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Alive</span>
          <span className="stat-value">{aliveCountries.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Dead</span>
          <span className="stat-value">{deadCountries.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total Countries</span>
          <span className="stat-value">{allCountries.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">World GDP</span>
          <span className="stat-value">{formatMoney(totalGDP)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">World Money</span>
          <span className="stat-value">{formatMoney(totalMoney)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Daily Income</span>
          <span className="stat-value">{formatMoney(totalDailyIncome)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">World MP</span>
          <span className="stat-value">{formatMoney(totalMP)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Territories Captured</span>
          <span className="stat-value">{totalTerritories}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total Battles</span>
          <span className="stat-value">{totalBattles}</span>
        </div>
      </div>

      <div className="controls-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search countries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-group">
          {(['all', 'alive', 'dead'] as FilterKey[]).map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="country-table-wrapper">
        <table className="country-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th onClick={() => handleSort('name')} className="sortable">Country{sortIndicator('name')}</th>
              <th>Player</th>
              <th>Leader</th>
              <th onClick={() => handleSort('money')} className="sortable">Money{sortIndicator('money')}</th>
              <th onClick={() => handleSort('mp')} className="sortable">MP{sortIndicator('mp')}</th>
              <th onClick={() => handleSort('gdp')} className="sortable">GDP{sortIndicator('gdp')}</th>
              <th onClick={() => handleSort('dailyIncome')} className="sortable">Daily Inc{sortIndicator('dailyIncome')}</th>
              <th>Total Daily</th>
              <th>Daily MP</th>
              <th onClick={() => handleSort('territories')} className="sortable">Terr{sortIndicator('territories')}</th>
              <th onClick={() => handleSort('researchTier')} className="sortable">Res{sortIndicator('researchTier')}</th>
              <th>Battles</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(country => (
              <tr
                key={country.id}
                className={`country-row ${!country.alive ? 'dead' : ''}`}
                onClick={() => onSelectCountry(country.id)}
              >
                <td className="flag-cell">{getFlagEmoji(country.name)}</td>
                <td className="name-cell">{country.name}</td>
                <td>{country.playerName || '\u2014'}</td>
                <td>{country.leaderName || '\u2014'}</td>
                <td className="num">{formatMoney(country.money)}</td>
                <td className="num">{formatMoney(country.mp)}</td>
                <td className="num">{country.gdp}</td>
                <td className="num">{formatMoney(country.dailyIncome)}</td>
                <td className="num">
                  {formatMoney(
                    country.dailyIncome +
                    country.capturedTerritories.filter(t => t.status === 'occupied').length * OCCUPIED_MONEY_INCOME +
                    country.capturedTerritories.filter(t => t.status === 'integrated').length * INTEGRATED_MONEY_INCOME
                  )}
                </td>
                <td className="num">{formatMoney(country.dailyMP)}</td>
                <td className="num">{country.capturedTerritories.length}</td>
                <td className="num">T{getResearchTierForGDP(country.gdp)}</td>
                <td className="num">{country.battles.length}</td>
                <td>
                  <span className={`status-badge ${country.alive ? 'alive' : 'dead'}`}>
                    {country.alive ? 'ALIVE' : 'DEAD'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">No countries found.</div>
      )}
    </div>
  );
}

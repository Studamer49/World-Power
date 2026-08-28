import { useState } from 'react';
import { useGameStore } from '../context/GameContext';
import { generateId } from '../utils/calculations';
import { getFlagEmoji } from '../data/flags';

type Props = { onClose: () => void };

export default function CreateCountryModal({ onClose }: Props) {
  const { state, dispatch } = useGameStore();
  const [name, setName] = useState('');
  const [player, setPlayer] = useState('');
  const [leader, setLeader] = useState('');
  const [government, setGovernment] = useState('');
  const [money, setMoney] = useState(10000);
  const [mp, setMp] = useState(1500);
  const [gdp, setGdp] = useState(20);
  const [dailyIncome, setDailyIncome] = useState(1500);
  const [dailyMP, setDailyMP] = useState(300);

  const create = () => {
    if (!name.trim()) return;
    dispatch({
      type: 'ADD_COUNTRY',
      payload: {
        id: generateId(),
        name: name.trim(),
        playerName: player,
        leaderName: leader,
        governmentName: government,
        flag: getFlagEmoji(name.trim()),
        alive: true,
        dateCreated: state.gameDate,
        money, mp, gdp, dailyIncome, dailyMP,
        researchTier: 1,
        investmentGDP: 0,
        completedResearch: [],
        militaryUnits: { infantry: 10, artillery: 2, tanks: 0, fighterJets: 0, bombers: 0, navalForces: 0, specialForces: 0, airTurrets: 0 },
        unitInventory: {
          infantry: { mp: 10, tier: 1 }, artillery: { mp: 2, tier: 1 },
          tanks: { mp: 0, tier: 1 }, fighterJets: { mp: 0, tier: 1 },
          bombers: { mp: 0, tier: 1 }, navalForces: { mp: 0, tier: 1 },
          specialForces: { mp: 0, tier: 1 }, airTurrets: { mp: 0, tier: 1 },
        },
        territories: [], capturedTerritories: [], territoryCaptureHistory: [],
        battles: [], wars: [], alliances: [], treaties: [], notes: [],
        manualOverrides: {},
      },
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>CREATE COUNTRY</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>
        <div className="form-grid">
          <label>Country Name<input className="input-sm full-width" value={name} onChange={e => setName(e.target.value)} autoFocus /></label>
          <label>Player Name<input className="input-sm full-width" value={player} onChange={e => setPlayer(e.target.value)} /></label>
          <label>Leader<input className="input-sm full-width" value={leader} onChange={e => setLeader(e.target.value)} /></label>
          <label>Government<input className="input-sm full-width" value={government} onChange={e => setGovernment(e.target.value)} /></label>
          <label>Starting Money<input type="number" className="input-sm full-width" value={money} onChange={e => setMoney(parseInt(e.target.value) || 0)} /></label>
          <label>Starting MP<input type="number" className="input-sm full-width" value={mp} onChange={e => setMp(parseInt(e.target.value) || 0)} /></label>
          <label>GDP<input type="number" className="input-sm full-width" value={gdp} onChange={e => setGdp(parseInt(e.target.value) || 0)} /></label>
          <label>Daily Income<input type="number" className="input-sm full-width" value={dailyIncome} onChange={e => setDailyIncome(parseInt(e.target.value) || 0)} /></label>
          <label>Daily MP<input type="number" className="input-sm full-width" value={dailyMP} onChange={e => setDailyMP(parseInt(e.target.value) || 0)} /></label>
        </div>
        <div className="center-row">
          <button className="btn btn-success" onClick={create}>CREATE</button>
        </div>
      </div>
    </div>
  );
}

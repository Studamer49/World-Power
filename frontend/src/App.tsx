import { useState, useEffect } from 'react';
import { useGameStore } from './context/GameContext';
import { dateToInputValue, inputValueToDate } from './utils/calculations';
import { useHashRoute, navigateTo } from './router';
import { useGameData } from './hooks/useGameData';
import { isAdmin } from './api/client';
import Dashboard from './components/Dashboard';
import CountryDetail from './components/CountryDetail';
import CreateCountryModal from './components/CreateCountryModal';
import BattleCalculator from './components/BattleCalculator';
import WarManager from './components/WarManager';
import MilitaryRatios from './components/MilitaryRatios';
import MatchupTable from './components/MatchupTable';
import AddTerritoryModal from './components/AddTerritoryModal';
import AddExpenseModal from './components/AddExpenseModal';
import AddMoneyChangeModal from './components/AddMoneyChangeModal';
import AddMPChangeModal from './components/AddMPChangeModal';
import NotebookMode from './components/NotebookMode';
import DailyUpdate from './components/DailyUpdate';
import HistoryViewer from './components/HistoryViewer';
import WorldMap from './components/WorldMap';
import TreatyModal from './components/TreatyModal';
import PublicDashboard from './components/PublicDashboard';
import PublicCountryDetail from './components/PublicCountryDetail';
import AdminLogin from './components/AdminLogin';
import NotesPanel from './components/NotesPanel';
import AdminNotes from './components/AdminNotes';
import CountryLoginModal from './components/CountryLoginModal';
import { useAuth } from './context/AuthContext';
import { getFlagEmoji } from './data/flags';

type Modal =
  | null
  | 'createCountry'
  | 'battleCalc'
  | 'warManager'
  | 'militaryRatios'
  | 'matchupTable'
  | 'addTerritory'
  | 'addExpense'
  | 'addMoneyChange'
  | 'addMPChange'
  | 'notebook'
  | 'dailyUpdate'
  | 'history'
  | 'map'
  | 'treaty'
  | 'adminNotes';

function AdminView() {
  const { state, dispatch, saveStatus, forceSave, loading } = useGameStore();
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [gameDayInput, setGameDayInput] = useState('');
  const [showDayInput, setShowDayInput] = useState(false);
  const [gameDateInput, setGameDateInput] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);

  useEffect(() => {
    const handler = () => setActiveModal('createCountry');
    window.addEventListener('open-create-country', handler);
    return () => window.removeEventListener('open-create-country', handler);
  }, []);

  const advanceDay = () => {
    dispatch({ type: 'NEXT_DAY' });
  };

  const setDay = () => {
    const day = parseInt(gameDayInput);
    if (!isNaN(day) && day > 0) {
      dispatch({ type: 'SET_GAME_DAY', payload: day });
      setShowDayInput(false);
      setGameDayInput('');
    }
  };

  const setDate = () => {
    const dateStr = inputValueToDate(gameDateInput);
    if (dateStr) {
      dispatch({ type: 'SET_GAME_DATE', payload: dateStr });
      setShowDateInput(false);
      setGameDateInput('');
    }
  };

  const exportGame = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world-power-day-${state.gameDay}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importGame = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          dispatch({ type: 'LOAD_STATE', payload: data });
        } catch {
          alert('Failed to import game data. Invalid file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const resetGame = () => {
    const confirm = window.prompt('Type RESET to permanently delete all game data:');
    if (confirm === 'RESET') {
      localStorage.removeItem('world-power-game-state');
      window.location.reload();
    }
  };

  const country = selectedCountryId ? state.countries[selectedCountryId] : null;

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-left">
            <h1 className="title">World Power</h1>
          </div>
        </header>
        <main className="main">
          <div className="empty-state">Loading game data...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="title">World Power</h1>
          <div className="game-day-display">
            <span className="label">DAY</span>
            <span className="value">{state.gameDay}</span>
            <span className="sep">|</span>
            <span className="label">DATE</span>
            <span className="value clickable" onClick={() => { setShowDateInput(!showDateInput); setShowDayInput(false); }}>{state.gameDate}</span>
          </div>
          {showDateInput && (
            <span className="day-input-group">
              <input
                type="date"
                className="input-sm"
                value={gameDateInput}
                onChange={e => setGameDateInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setDate()}
                autoFocus
              />
              <button className="btn btn-sm" onClick={setDate}>SET</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowDateInput(false)}>X</button>
            </span>
          )}
        </div>
        <div className="header-center">
          <button className="btn btn-sm" onClick={advanceDay}>NEXT DAY</button>
          {showDayInput ? (
            <span className="day-input-group">
              <input
                type="number"
                className="input-sm"
                value={gameDayInput}
                onChange={e => setGameDayInput(e.target.value)}
                placeholder="Day #"
                onKeyDown={e => e.key === 'Enter' && setDay()}
                autoFocus
              />
              <button className="btn btn-sm" onClick={setDay}>SET</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowDayInput(false)}>X</button>
            </span>
          ) : (
            <button className="btn btn-sm btn-ghost" onClick={() => { setShowDayInput(true); setShowDateInput(false); }}>SET DAY</button>
          )}
          <button className="btn btn-sm btn-accent" onClick={() => setActiveModal('dailyUpdate')}>DAILY UPDATE</button>
          <button className="btn btn-sm btn-accent" onClick={() => setActiveModal('notebook')}>NOTEBOOK</button>
          <button className="btn btn-sm btn-accent" onClick={() => setActiveModal('adminNotes')}>MESSAGES</button>
        </div>
        <div className="header-right">
          <button className="btn btn-sm btn-ghost" onClick={() => navigateTo('/')}>PUBLIC VIEW</button>
          <button className="btn btn-sm" onClick={() => setActiveModal('createCountry')}>+ COUNTRY</button>
          <button className="btn btn-sm btn-accent" onClick={() => setActiveModal('battleCalc')}>BATTLE CALC</button>
          <button className="btn btn-sm btn-accent" onClick={() => setActiveModal('warManager')}>WARS</button>
          <button className="btn btn-sm" onClick={() => setActiveModal('treaty')}>TREATIES</button>
          <button className="btn btn-sm" onClick={() => setActiveModal('addTerritory')}>+ TERRITORY</button>
          <button className="btn btn-sm" onClick={() => setActiveModal('addExpense')}>+ EXPENSE</button>
          <button className="btn btn-sm" onClick={() => setActiveModal('addMoneyChange')}>+ $ CHANGE</button>
          <button className="btn btn-sm" onClick={() => setActiveModal('addMPChange')}>+ MP CHANGE</button>
          <span className={`save-indicator ${saveStatus}`}>{saveStatus === 'saved' ? '\u2713 Saved' : 'Saving...'}</span>
          <button className="btn btn-sm btn-ghost" onClick={forceSave}>SAVE NOW</button>
        </div>
      </header>

      <nav className="sub-nav">
        <button className="btn btn-xs" onClick={() => setActiveModal('militaryRatios')}>MILITARY RATIOS</button>
        <button className="btn btn-xs" onClick={() => setActiveModal('matchupTable')}>MATCHUP TABLE</button>
        <button className="btn btn-xs btn-accent" onClick={() => setActiveModal('map')}>MAP</button>
      </nav>

      <main className="main">
        {activeModal === 'map' ? (
          <WorldMap gameState={state} onSelectCountry={(id) => { setActiveModal(null); setSelectedCountryId(id); }} />
        ) : selectedCountryId && country ? (
          <CountryDetail
            country={country}
            allCountries={state.countries}
            gameState={state}
            onBack={() => setSelectedCountryId(null)}
          />
        ) : (
          <Dashboard
            gameState={state}
            onSelectCountry={setSelectedCountryId}
            onOpenHistory={() => setActiveModal('history')}
          />
        )}
      </main>

      {activeModal === 'createCountry' && (
        <CreateCountryModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'battleCalc' && (
        <BattleCalculator gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'warManager' && (
        <WarManager gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'militaryRatios' && (
        <MilitaryRatios onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'matchupTable' && (
        <MatchupTable onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'addTerritory' && (
        <AddTerritoryModal gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'addExpense' && (
        <AddExpenseModal gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'addMoneyChange' && (
        <AddMoneyChangeModal gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'addMPChange' && (
        <AddMPChangeModal gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'notebook' && (
        <NotebookMode gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'dailyUpdate' && (
        <DailyUpdate gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'history' && (
        <HistoryViewer gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'treaty' && (
        <TreatyModal gameState={state} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'adminNotes' && (
        <AdminNotes gameState={state} onClose={() => setActiveModal(null)} />
      )}

      <footer className="footer">
        <button className="btn btn-sm" onClick={exportGame}>EXPORT GAME</button>
        <button className="btn btn-sm" onClick={importGame}>IMPORT GAME</button>
        <button className="btn btn-sm btn-danger" onClick={resetGame}>RESET GAME</button>
      </footer>
    </div>
  );
}

function PublicView() {
  const { gameState, loading, error } = useGameData();
  const { countryName, loggedIn, logoutCountry } = useAuth();
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showCountryLogin, setShowCountryLogin] = useState(false);

  const country = selectedCountryId && gameState ? gameState.countries[selectedCountryId] : null;
  const loggedCountry = loggedIn && countryName && gameState
    ? Object.values(gameState.countries).find(c => c.name === countryName) || null
    : null;

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-left">
            <h1 className="title">World Power</h1>
          </div>
          <div className="header-right">
            <span className="text-muted">Loading game data...</span>
          </div>
        </header>
        <main className="main">
          <div className="empty-state">Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-left">
            <h1 className="title">World Power</h1>
          </div>
          <div className="header-right">
            <button className="btn btn-sm btn-ghost" onClick={() => navigateTo('/admin/login')}>GAME MASTER</button>
          </div>
        </header>
        <main className="main">
          <div className="empty-state">Failed to load game data: {error || 'Unknown error'}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="title">World Power</h1>
          <div className="game-day-display">
            <span className="label">DAY</span>
            <span className="value">{gameState.gameDay}</span>
            <span className="sep">|</span>
            <span className="label">DATE</span>
            <span className="value">{gameState.gameDate}</span>
          </div>
        </div>
        <div className="header-right">
          {loggedIn && loggedCountry ? (
            <button className="btn btn-sm btn-accent" onClick={() => setShowNotes(true)}>
              {getFlagEmoji(loggedCountry.name)} {loggedCountry.name} &#9679; MESSAGES
            </button>
          ) : (
            <button className="btn btn-sm btn-ghost" onClick={() => setShowNotes(true)}>MESSAGES</button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => navigateTo('/admin/login')}>GAME MASTER</button>
          {loggedIn && loggedCountry ? (
            <button className="btn btn-sm" onClick={logoutCountry}>
              LOGOUT {getFlagEmoji(loggedCountry.name)} {loggedCountry.name}
            </button>
          ) : (
            <button className="btn btn-sm" onClick={() => setShowCountryLogin(true)}>LOGIN</button>
          )}
        </div>
      </header>

      <main className="main">
        {country ? (
          <PublicCountryDetail
            country={country}
            allCountries={gameState.countries}
            gameState={gameState}
            onBack={() => setSelectedCountryId(null)}
          />
        ) : (
          <PublicDashboard
            gameState={gameState}
            onSelectCountry={setSelectedCountryId}
          />
        )}
      </main>

      <footer className="footer">
        <span className="text-muted">World Power &mdash; Read-only public view</span>
      </footer>

      {showNotes && gameState && (
        <NotesPanel gameState={gameState} onClose={() => setShowNotes(false)} />
      )}
      {showCountryLogin && gameState && (
        <CountryLoginModal gameState={gameState} onClose={() => setShowCountryLogin(false)} />
      )}
    </div>
  );
}

export default function App() {
  const route = useHashRoute();

  if (route === '/admin/login') {
    return <AdminLogin />;
  }

  if (route === '/admin') {
    if (!isAdmin()) {
      navigateTo('/admin/login');
      return null;
    }
    return <AdminView />;
  }

  return <PublicView />;
}

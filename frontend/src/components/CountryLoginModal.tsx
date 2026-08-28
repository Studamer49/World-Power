import { useState } from 'react';
import { GameState } from '../types';
import { getFlagEmoji } from '../data/flags';
import { useAuth } from '../context/AuthContext';

type Props = {
  gameState: GameState;
  onClose: () => void;
};

export default function CountryLoginModal({ gameState, onClose }: Props) {
  const { loginCountry } = useAuth();
  const [countryId, setCountryId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const countries = Object.values(gameState.countries).filter(c => c.alive);

  const selectedCountry = countries.find(c => c.id === countryId);

  const handleLogin = async () => {
    if (!selectedCountry || !password.trim()) return;
    setLoading(true);
    setError('');
    const res = await loginCountry(selectedCountry.name, password.trim());
    setLoading(false);
    if (res.ok) {
      onClose();
    } else {
      setError(res.error || 'Invalid password');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>COUNTRY LOGIN</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>
        <div className="form-grid">
          <p className="text-muted">
            Log in with your country's password to send messages and edit your country's profile.
          </p>
          <label>
            Country
            <select
              className="input full-width"
              value={countryId}
              onChange={e => setCountryId(e.target.value)}
            >
              <option value="">-- Select country --</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{getFlagEmoji(c.name)} {c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Country Password
            <input
              className="input full-width"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter this country's password"
              autoFocus
            />
          </label>
          {error && <p className="text-danger">{error}</p>}
          <div className="center-row">
            <button className="btn btn-success" onClick={handleLogin} disabled={loading || !countryId || !password.trim()}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { authApi, setAuthToken } from '../api/client';
import { navigateTo } from '../router';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { token } = await authApi.login(password);
      setAuthToken(token);
      navigateTo('/admin');
    } catch (e: any) {
      setError(e.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center' }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>GAME MASTER LOGIN</h2>
        </div>
        <div className="form-grid">
          <label>
            Admin Password
            <input
              className="input-sm full-width"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
              placeholder="Enter admin password"
            />
          </label>
          {error && <p className="text-danger">{error}</p>}
          <div className="center-row">
            <button className="btn btn-success" onClick={handleLogin} disabled={loading}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

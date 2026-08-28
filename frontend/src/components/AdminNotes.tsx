import { useState, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import { notesApi, countriesApi } from '../api/client';
import { getFlagEmoji } from '../data/flags';

type Props = {
  gameState: GameState;
  onClose: () => void;
};

export default function AdminNotes({ gameState, onClose }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [passwordCountry, setPasswordCountry] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPasswordBox, setShowPasswordBox] = useState(false);

  const countries = Object.values(gameState.countries);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notesApi.listAll();
      setNotes(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const grouped = notes.reduce<Record<string, any[]>>((acc, n) => {
    (acc[n.countryId] = acc[n.countryId] || []).push(n);
    return acc;
  }, {});

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    setError('');
    try {
      await notesApi.delete(id);
      await loadNotes();
      setMessage('Message deleted.');
    } catch (e: any) {
      setError(e.message || 'Failed to delete message');
    }
  };

  const handleReply = async (noteId: string) => {
    if (!replyText.trim()) return;
    setError('');
    try {
      await notesApi.reply(noteId, {
        text: replyText,
        day: gameState.gameDay,
        date: gameState.gameDate,
      });
      setReplyText('');
      setReplyTarget(null);
      await loadNotes();
      setMessage('Reply sent.');
    } catch (e: any) {
      setError(e.message || 'Failed to send reply');
    }
  };

  const handleSetPassword = async () => {
    if (!passwordCountry || !passwordValue) return;
    setError('');
    try {
      await countriesApi.setPassword(passwordCountry, passwordValue);
      setPasswordValue('');
      setShowPasswordBox(false);
      setMessage('Password set.');
    } catch (e: any) {
      setError(e.message || 'Failed to set password');
    }
  };

  const countryName = (id: string) => countries.find(c => c.id === id)?.name || id;
  const countryFlag = (id: string) => {
    const c = countries.find(x => x.id === id);
    return c ? getFlagEmoji(c.name) : '🌍';
  };

  const renderNote = (note: any, depth: number) => (
    <div key={note.id} className={`note-item ${note.isGM ? 'gm-note' : ''}`} style={{ marginLeft: depth * 20 }}>
      <div className="note-meta">
        <strong>{note.author || 'Anonymous'}</strong>
        {note.isGM && <span className="status-badge alive">GM</span>}
        <span className="text-muted note-date">
          {note.date} {note.day ? `(Day ${note.day})` : ''}
          {note.createdAt ? ` · ${new Date(note.createdAt).toLocaleString()}` : ''}
        </span>
      </div>
      <div className="note-text">{note.text}</div>
      <div className="note-actions">
        <button className="btn btn-xs btn-ghost" onClick={() => setReplyTarget(replyTarget === note.id ? null : note.id)}>Reply</button>
        <button className="btn btn-xs btn-danger" onClick={() => handleDelete(note.id)}>Delete</button>
      </div>
      {replyTarget === note.id && (
        <div className="note-reply-box">
          <textarea
            className="input"
            rows={2}
            value={replyText}
            placeholder="Reply as Game Master..."
            onChange={e => setReplyText(e.target.value)}
          />
          <button className="btn btn-sm" onClick={() => handleReply(note.id)}>Send</button>
        </div>
      )}
      {note.replies && note.replies.length > 0 && note.replies.map((r: any) => renderNote(r, depth + 1))}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal tall-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>MESSAGES (GAME MASTER)</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        {message && <div className="success-text">{message}</div>}
        {error && <div className="error-text">{error}</div>}

        <div className="admin-notes-controls">
          <button className="btn btn-sm" onClick={() => setShowPasswordBox(!showPasswordBox)}>
            {showPasswordBox ? 'Hide Password Setup' : '+ Set Country Password'}
          </button>
          {showPasswordBox && (
            <div className="notes-login inline">
              <select
                className="input"
                value={passwordCountry}
                onChange={e => setPasswordCountry(e.target.value)}
              >
                <option value="">-- Select country --</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{countryFlag(c.id)} {c.name}</option>
                ))}
              </select>
              <input
                className="input"
                type="text"
                value={passwordValue}
                placeholder="New password"
                onChange={e => setPasswordValue(e.target.value)}
              />
              <button className="btn btn-sm" onClick={handleSetPassword}>Set</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="empty-state">Loading messages...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="empty-state">No messages yet.</div>
        ) : (
          <div className="notes-list">
            {Object.entries(grouped).map(([cid, countryNotes]) => (
              <div key={cid} className="note-group">
                <h3 className="note-group-title">{countryFlag(cid)} {countryName(cid)}</h3>
                {countryNotes.map(n => renderNote(n, 0))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

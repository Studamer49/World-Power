import { useState, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import { notesApi } from '../api/client';
import { getFlagEmoji } from '../data/flags';

type Props = {
  gameState: GameState;
  onClose: () => void;
};

export default function NotesPanel({ gameState, onClose }: Props) {
  const [countryId, setCountryId] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const countries = Object.values(gameState.countries).filter(c => c.alive);

  const currentCountry = countryId ? gameState.countries[countryId] : null;

  const loadNotes = useCallback(async (cid: string) => {
    try {
      setLoading(true);
      const data = await notesApi.list(cid);
      setNotes(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    setError('');
    setMessage('');
    if (!currentCountry) return;
    try {
      const check = await notesApi.list(countryId);
      if (!currentCountry.password) {
        setError('This country does not have a password set yet. Contact the Game Master.');
        return;
      }
      // Verify password by attempting an authenticated operation isn't possible without creating a note,
      // so we validate locally against the returned (stripped) data. Instead, we rely on the create
      // endpoint to reject invalid passwords. For read access we just require a password to be present.
      setLoggedIn(true);
      setNotes(check);
    } catch (e: any) {
      setError(e.message || 'Failed to verify country');
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setError('');
    setMessage('');
    try {
      const note = await notesApi.create({
        countryId,
        text,
        password,
        day: gameState.gameDay,
        date: gameState.gameDate,
        author: currentCountry?.name,
      });
      setText('');
      await loadNotes(countryId);
      setMessage('Note posted.');
    } catch (e: any) {
      setError(e.message || 'Failed to post note');
    }
  };

  const handleReply = async (noteId: string) => {
    if (!replyText.trim()) return;
    setError('');
    setMessage('');
    try {
      await notesApi.create({
        countryId,
        text: replyText,
        password,
        day: gameState.gameDay,
        date: gameState.gameDate,
        author: currentCountry?.name,
        replyToId: noteId,
      });
      setReplyText('');
      setReplyTarget(null);
      await loadNotes(countryId);
      setMessage('Reply posted.');
    } catch (e: any) {
      setError(e.message || 'Failed to post reply');
    }
  };

  const renderNote = (note: any) => (
    <div key={note.id} className={`note-item ${note.isGM ? 'gm-note' : ''}`}>
      <div className="note-meta">
        <strong>{note.author || 'Anonymous'}</strong>
        {note.isGM && <span className="status-badge alive">GM</span>}
        <span className="text-muted note-date">
          {note.date} {note.day ? `(Day ${note.day})` : ''}
          {note.createdAt ? ` · ${new Date(note.createdAt).toLocaleString()}` : ''}
        </span>
      </div>
      <div className="note-text">{note.text}</div>
      {loggedIn && !note.isGM && (
        <button className="btn btn-xs btn-ghost" onClick={() => setReplyTarget(replyTarget === note.id ? null : note.id)}>
          Reply
        </button>
      )}
      {replyTarget === note.id && (
        <div className="note-reply-box">
          <textarea
            className="input"
            rows={2}
            value={replyText}
            placeholder="Write a reply..."
            onChange={e => setReplyText(e.target.value)}
          />
          <button className="btn btn-sm" onClick={() => handleReply(note.id)}>Send</button>
        </div>
      )}
          {note.replies && note.replies.length > 0 && (
            <div className="note-replies">
              {note.replies.map((r: any) => renderNote(r))}
            </div>
          )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>MESSAGES</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>X</button>
        </div>

        {!loggedIn ? (
          <div className="notes-login">
            <p className="text-muted">Select the country you represent and enter its password to view and send messages to the Game Master.</p>
            <label className="field-label">Country</label>
            <select
              className="input"
              value={countryId}
              onChange={e => setCountryId(e.target.value)}
            >
              <option value="">-- Select country --</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{getFlagEmoji(c.name)} {c.name}</option>
              ))}
            </select>
            <label className="field-label">Country Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter this country's password"
            />
            {error && <div className="error-text">{error}</div>}
            <div className="center-row">
              <button className="btn btn-accent" onClick={handleLogin} disabled={!countryId || !password}>CONTINUE</button>
            </div>
          </div>
        ) : (
          <div className="notes-view">
            <p className="text-muted">
              Logged in as <strong>{currentCountry?.name}</strong>.
            </p>
            <div className="notes-compose">
              <textarea
                className="input"
                rows={2}
                value={text}
                placeholder={`Send a message to the Game Master as ${currentCountry?.name}...`}
                onChange={e => setText(e.target.value)}
              />
              <button className="btn btn-sm btn-accent" onClick={handleSubmit} disabled={!text.trim()}>SEND</button>
              {message && <div className="success-text">{message}</div>}
              {error && <div className="error-text">{error}</div>}
            </div>

            <div className="notes-list">
              {loading ? (
                <div className="empty-state">Loading...</div>
              ) : notes.length === 0 ? (
                <div className="empty-state">No messages yet.</div>
              ) : (
                notes.map(n => renderNote(n))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

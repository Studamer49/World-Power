import { useState, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import { notesApi } from '../api/client';
import { getFlagEmoji } from '../data/flags';
import { useAuth } from '../context/AuthContext';
import CountryLoginModal from './CountryLoginModal';

type Props = {
  gameState: GameState;
  onClose: () => void;
};

export default function NotesPanel({ gameState, onClose }: Props) {
  const { countryId, countryName, loggedIn, logoutCountry } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentCountry = countryName
    ? Object.values(gameState.countries).find(c => c.name === countryName) || null
    : null;

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

  // Load this country's messages once we are logged in.
  useEffect(() => {
    if (loggedIn && countryId) {
      loadNotes(countryId);
    } else if (!loggedIn) {
      setNotes([]);
    }
  }, [loggedIn, countryId, loadNotes]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setError('');
    setMessage('');
    try {
      const note = await notesApi.create({
        countryId,
        text,
        day: gameState.gameDay,
        date: gameState.gameDate,
        author: currentCountry?.name,
      });
      setText('');
      await loadNotes(countryId!);
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
        day: gameState.gameDay,
        date: gameState.gameDate,
        author: currentCountry?.name,
        replyToId: noteId,
      });
      setReplyText('');
      setReplyTarget(null);
      await loadNotes(countryId!);
      setMessage('Reply posted.');
    } catch (e: any) {
      setError(e.message || 'Failed to post reply');
    }
  };

  const handleLogout = () => {
    logoutCountry();
    setNotes([]);
    setMessage('');
    setError('');
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
            <p className="text-muted">
              Log in with your country's password to view and send messages to the Game Master.
            </p>
            <div className="center-row">
              <button className="btn btn-accent" onClick={() => setShowLogin(true)}>LOG IN AS MY COUNTRY</button>
            </div>
            {showLogin && (
              <CountryLoginModal gameState={gameState} onClose={() => setShowLogin(false)} />
            )}
          </div>
        ) : (
          <div className="notes-view">
            <div className="notes-authbar">
              <strong>{currentCountry ? `${getFlagEmoji(currentCountry.name)} ${currentCountry.name}` : 'Logged in'}</strong>
              <button className="btn btn-xs btn-ghost" onClick={handleLogout}>LOGOUT</button>
            </div>
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

import { useState, useEffect, useCallback, useRef } from 'react';
import { gameStateApi } from '../api/client';
import { normalizeLoadedState } from '../context/GameContext';
import { GameState } from '../types';

const POLL_INTERVAL = 5000;
const BOOT_DELAY = 1200;

export function useGameData() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      if (!booted.current) {
        await new Promise(r => setTimeout(r, BOOT_DELAY));
        booted.current = true;
      }
      const { data } = await gameStateApi.get();
      if (!data) {
        setGameState(null);
        setError('No game data yet. The Game Master needs to open and save the admin view first.');
        return;
      }
      setGameState(normalizeLoadedState(data));
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch game data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { gameState, loading, error, refresh: fetchAll };
}

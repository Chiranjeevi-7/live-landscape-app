import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'spotify_tokens';
const POLL_INTERVAL = 1500; // poll every 1.5s for tight sync

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  progress: number;
  duration: number;
  isPlaying: boolean;
}

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function loadTokens(): SpotifyTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveTokens(tokens: SpotifyTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useSpotify() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const tokensRef = useRef<SpotifyTokens | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProgressRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  // Initialize from stored tokens
  useEffect(() => {
    const tokens = loadTokens();
    if (tokens) {
      tokensRef.current = tokens;
      setConnected(true);
      startPolling();
    }
    // Handle OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      handleCallback(code);
      window.history.replaceState({}, '', window.location.pathname);
    }
    return () => stopPolling();
  }, []);

  const getValidToken = useCallback(async (): Promise<string | null> => {
    const tokens = tokensRef.current;
    if (!tokens) return null;

    // Refresh if expiring within 60s
    if (Date.now() > tokens.expires_at - 60000) {
      try {
        const { data, error } = await supabase.functions.invoke('spotify-auth', {
          body: { action: 'refresh_token', refresh_token: tokens.refresh_token },
        });
        if (error || data?.error) {
          clearTokens();
          tokensRef.current = null;
          setConnected(false);
          return null;
        }
        const updated: SpotifyTokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || tokens.refresh_token,
          expires_at: Date.now() + (data.expires_in * 1000),
        };
        tokensRef.current = updated;
        saveTokens(updated);
        return updated.access_token;
      } catch {
        return null;
      }
    }
    return tokens.access_token;
  }, []);

  const spotifyApi = useCallback(async (endpoint: string, method = 'GET', body?: any) => {
    const token = await getValidToken();
    if (!token) return null;
    const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 204) return {};
    if (!res.ok) return null;
    return res.json();
  }, [getValidToken]);

  const fetchCurrentTrack = useCallback(async () => {
    const data = await spotifyApi('/me/player/currently-playing');
    if (!data || !data.item) {
      setTrack(null);
      return;
    }

    const serverProgress = data.progress_ms || 0;
    const serverTimestamp = Date.now();

    lastProgressRef.current = serverProgress;
    lastTimestampRef.current = serverTimestamp;

    setTrack({
      id: data.item.id,
      name: data.item.name,
      artist: data.item.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      album: data.item.album?.name || '',
      albumArt: data.item.album?.images?.[0]?.url || '',
      progress: serverProgress,
      duration: data.item.duration_ms || 0,
      isPlaying: data.is_playing,
    });
  }, [spotifyApi]);

  // Interpolated progress for smooth sync
  const getInterpolatedProgress = useCallback((): number => {
    if (!track) return 0;
    if (!track.isPlaying) return lastProgressRef.current;
    const elapsed = Date.now() - lastTimestampRef.current;
    return Math.min(lastProgressRef.current + elapsed, track.duration);
  }, [track]);

  const startPolling = useCallback(() => {
    stopPolling();
    fetchCurrentTrack();
    pollRef.current = setInterval(fetchCurrentTrack, POLL_INTERVAL);
  }, [fetchCurrentTrack]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const redirect_uri = `${window.location.origin}/callback`;
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'get_auth_url', redirect_uri },
      });
      if (error || !data?.url) {
        console.error('Failed to get auth URL', error);
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('Spotify connect error:', err);
      setLoading(false);
    }
  }, []);

  const handleCallback = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const redirect_uri = `${window.location.origin}/callback`;
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'exchange_token', code, redirect_uri },
      });
      if (error || data?.error) {
        console.error('Token exchange failed', data?.error);
        setLoading(false);
        return;
      }
      const tokens: SpotifyTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000),
      };
      tokensRef.current = tokens;
      saveTokens(tokens);
      setConnected(true);
      setLoading(false);
      startPolling();
    } catch (err) {
      console.error('Callback error:', err);
      setLoading(false);
    }
  }, [startPolling]);

  const disconnect = useCallback(() => {
    clearTokens();
    tokensRef.current = null;
    setConnected(false);
    setTrack(null);
    stopPolling();
  }, [stopPolling]);

  const play = useCallback(async () => {
    await spotifyApi('/me/player/play', 'PUT');
    setTimeout(fetchCurrentTrack, 300);
  }, [spotifyApi, fetchCurrentTrack]);

  const pause = useCallback(async () => {
    await spotifyApi('/me/player/pause', 'PUT');
    setTimeout(fetchCurrentTrack, 300);
  }, [spotifyApi, fetchCurrentTrack]);

  const next = useCallback(async () => {
    await spotifyApi('/me/player/next', 'POST');
    setTimeout(fetchCurrentTrack, 500);
  }, [spotifyApi, fetchCurrentTrack]);

  const prev = useCallback(async () => {
    await spotifyApi('/me/player/previous', 'POST');
    setTimeout(fetchCurrentTrack, 500);
  }, [spotifyApi, fetchCurrentTrack]);

  return {
    connected,
    loading,
    track,
    connect,
    disconnect,
    play,
    pause,
    next,
    prev,
    getInterpolatedProgress,
  };
}

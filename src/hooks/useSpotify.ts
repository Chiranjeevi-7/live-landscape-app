import { useState, useCallback } from 'react';

interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  progress: number;
  duration: number;
  isPlaying: boolean;
}

export function useSpotify() {
  const [connected] = useState(false);
  const [loading] = useState(false);
  const [track] = useState<SpotifyTrack | null>(null);

  const connect = useCallback(async () => {
    console.log('Spotify integration requires backend edge functions');
  }, []);

  const disconnect = useCallback(() => {}, []);
  const play = useCallback(() => {}, []);
  const pause = useCallback(() => {}, []);
  const next = useCallback(() => {}, []);
  const prev = useCallback(() => {}, []);

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
  };
}

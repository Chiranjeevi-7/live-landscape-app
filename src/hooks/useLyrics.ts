import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SpotifyTrack } from '@/hooks/useSpotify';

export interface LyricLine {
  time: number;
  text: string;
}

interface LyricsData {
  synced: boolean;
  lines: LyricLine[];
  source: string | null;
}

const lyricsCache = new Map<string, LyricsData>();

export function useLyrics(
  track: SpotifyTrack | null,
  getProgress: () => number,
) {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const animFrameRef = useRef<number>(0);
  const lastTrackId = useRef<string>('');

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!track || track.id === lastTrackId.current) return;
    lastTrackId.current = track.id;

    const cacheKey = `${track.artist}::${track.name}`;
    const cached = lyricsCache.get(cacheKey);
    if (cached) {
      setLyrics(cached);
      setCurrentLineIndex(-1);
      return;
    }

    setLoading(true);
    setLyrics(null);
    setCurrentLineIndex(-1);

    supabase.functions.invoke('lyrics-sync', {
      body: {
        track_name: track.name,
        artist_name: track.artist,
        album_name: track.album,
        duration: track.duration / 1000,
      },
    }).then(({ data, error }) => {
      if (error || !data || data.error) {
        setLyrics({ synced: false, lines: [], source: null });
        setLoading(false);
        return;
      }
      lyricsCache.set(cacheKey, data);
      setLyrics(data);
      setLoading(false);
    });
  }, [track?.id, track?.name, track?.artist]);

  // Real-time line sync using requestAnimationFrame for smoothness
  const syncLine = useCallback(() => {
    if (!lyrics?.synced || !lyrics.lines.length || !track?.isPlaying) {
      animFrameRef.current = requestAnimationFrame(syncLine);
      return;
    }

    const progress = getProgress();
    let idx = -1;

    // Binary-ish search for current line
    for (let i = lyrics.lines.length - 1; i >= 0; i--) {
      if (progress >= lyrics.lines[i].time) {
        idx = i;
        break;
      }
    }

    setCurrentLineIndex(idx);
    animFrameRef.current = requestAnimationFrame(syncLine);
  }, [lyrics, track?.isPlaying, getProgress]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(syncLine);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [syncLine]);

  return {
    lyrics,
    currentLineIndex,
    loading,
  };
}

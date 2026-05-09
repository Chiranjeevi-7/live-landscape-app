import { Play, Pause, SkipBack, SkipForward, Music, LogOut, Shuffle } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { useEffect, useState } from 'react';

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function SpotifyWidget() {
  const { connected, loading, track, connect, disconnect, play, pause, next, prev, toggleShuffle, getInterpolatedProgress } = useSpotify();
  const [, force] = useState(0);

  // Light tick for smooth progress only when playing
  useEffect(() => {
    if (!track?.isPlaying) return;
    const id = setInterval(() => force(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [track?.isPlaying]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
        <Music className="w-6 h-6 text-muted-foreground" />
        <span className="text-sm text-muted-foreground text-center">
          {loading ? 'Connecting…' : 'Connect Spotify'}
        </span>
        {!loading && (
          <button onClick={(e) => { e.stopPropagation(); connect(); }} className="btn-native accent text-sm">
            Connect
          </button>
        )}
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
        <Music className="w-6 h-6 text-muted-foreground/60 animate-pulse" />
        <span className="text-xs text-muted-foreground text-center">
          Start playing on any device
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); disconnect(); }}
          className="btn-icon w-7 h-7 opacity-50 hover:opacity-100"
          title="Disconnect"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const cur = getInterpolatedProgress();
  const progress = track.duration > 0 ? (cur / track.duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 justify-between">
      {/* Top: art + meta */}
      <div className="flex items-center gap-3 min-w-0">
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt={track.album}
            className="w-14 h-14 rounded-xl object-cover shrink-0 transition-opacity duration-500"
            style={{ boxShadow: '0 6px 20px -8px hsl(0 0% 0% / 0.5)' }}
          />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--surface-bright))' }}>
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate leading-tight">{track.name}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); disconnect(); }}
          className="btn-icon w-7 h-7 opacity-40 hover:opacity-100 shrink-0"
          title="Disconnect"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="progress-track w-full">
          <div className="progress-fill transition-all duration-700 ease-linear" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className="flex justify-between text-[0.65rem] text-muted-foreground tabular-nums">
          <span>{fmt(cur)}</span>
          <span>{fmt(track.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
          className="btn-icon w-8 h-8 transition-colors"
          style={track.shuffle ? { color: 'hsl(var(--accent))' } : { opacity: 0.6 }}
          title="Shuffle"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); prev(); }} className="btn-icon w-9 h-9"><SkipBack className="w-4 h-4" /></button>
        <button
          onClick={(e) => { e.stopPropagation(); track.isPlaying ? pause() : play(); }}
          className="btn-icon accent w-11 h-11"
        >
          {track.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); next(); }} className="btn-icon w-9 h-9"><SkipForward className="w-4 h-4" /></button>
        <span className="w-8" />
      </div>
    </div>
  );
}

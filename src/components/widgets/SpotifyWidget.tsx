import { Play, Pause, SkipBack, SkipForward, Music, LogOut, Shuffle, Volume1, Volume2 } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { useEffect, useState } from 'react';

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function SpotifyWidget() {
  const { connected, loading, track, connect, disconnect, play, pause, next, prev, toggleShuffle, setVolume, getInterpolatedProgress } = useSpotify();
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
  const remaining = Math.max(0, track.duration - cur);

  return (
    <div className="flex flex-col h-full w-full p-4 gap-3 min-h-0">
      {/* Album art — large, square, dominant */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt={track.album}
            className="h-full max-h-full aspect-square rounded-2xl object-cover transition-opacity duration-500"
            style={{ boxShadow: '0 12px 40px -12px hsl(0 0% 0% / 0.7)' }}
          />
        ) : (
          <div className="h-full aspect-square rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--surface-bright))' }}>
            <Music className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
          className="absolute top-1.5 left-1.5 btn-icon w-7 h-7 backdrop-blur-md bg-black/30"
          style={track.shuffle ? { color: 'hsl(var(--accent))' } : { opacity: 0.6 }}
          title="Shuffle"
        >
          <Shuffle className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); disconnect(); }}
          className="absolute top-1.5 right-1.5 btn-icon w-7 h-7 backdrop-blur-md bg-black/30 opacity-50 hover:opacity-100"
          title="Disconnect"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>

      {/* Track meta */}
      <div className="flex flex-col min-w-0 px-0.5">
        {track.device && (
          <div className="text-[0.65rem] text-muted-foreground truncate">{track.device}</div>
        )}
        <div className="text-base font-semibold text-foreground truncate leading-tight">{track.name}</div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1">
        <div className="progress-track w-full">
          <div className="progress-fill transition-all duration-700 ease-linear" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className="flex justify-between text-[0.65rem] text-muted-foreground tabular-nums px-0.5">
          <span>{fmt(cur)}</span>
          <span>-{fmt(remaining)}</span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-around">
        <button onClick={(e) => { e.stopPropagation(); prev(); }} className="btn-icon w-10 h-10 bg-transparent">
          <SkipBack className="w-5 h-5 fill-current" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); track.isPlaying ? pause() : play(); }}
          className="btn-icon w-12 h-12 bg-transparent"
        >
          {track.isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); next(); }} className="btn-icon w-10 h-10 bg-transparent">
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Volume slider */}
      <div className="flex items-center gap-2 px-0.5" onClick={(e) => e.stopPropagation()}>
        <Volume1 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          value={track.volume}
          onChange={(e) => setVolume(parseInt(e.target.value, 10))}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-foreground"
          style={{
            background: `linear-gradient(to right, hsl(var(--foreground) / 0.85) 0%, hsl(var(--foreground) / 0.85) ${track.volume}%, hsl(var(--surface-bright)) ${track.volume}%, hsl(var(--surface-bright)) 100%)`,
          }}
        />
        <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

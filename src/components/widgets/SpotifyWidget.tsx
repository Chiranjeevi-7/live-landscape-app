import { Play, Pause, SkipBack, SkipForward, Music, LogOut, Shuffle, Repeat, Repeat1, Volume1, Volume2 } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { useEffect, useRef, useState, useCallback } from 'react';

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** Pointer-driven slider that works on desktop, modern phones and old Android WebViews. */
function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastSentRef = useRef(value);
  const [local, setLocal] = useState(value);

  // sync from upstream when not dragging
  useEffect(() => {
    if (!draggingRef.current) setLocal(value);
  }, [value]);

  const compute = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  };

  const commit = useCallback((v: number, force = false) => {
    setLocal(v);
    // throttle network: only send when changed by ≥2 or on release
    if (force || Math.abs(v - lastSentRef.current) >= 2) {
      lastSentRef.current = v;
      onChange(v);
    }
  }, [onChange]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    commit(compute(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    commit(compute(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    commit(compute(e.clientX), true);
  };

  // Touch fallback for very old WebViews that don't fire pointer events
  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    draggingRef.current = true;
    commit(compute(e.touches[0].clientX));
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    commit(compute(e.touches[0].clientX));
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const x = e.changedTouches[0]?.clientX ?? 0;
    commit(compute(x), true);
  };

  return (
    <div className="flex items-center gap-2 px-0.5" onClick={(e) => e.stopPropagation()}>
      <Volume1 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div
        ref={trackRef}
        className="relative flex-1 h-6 flex items-center cursor-pointer touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute inset-x-0 h-1 rounded-full" style={{ background: 'hsl(var(--surface-bright))' }} />
        <div className="absolute h-1 rounded-full" style={{ width: `${local}%`, background: 'hsl(var(--foreground) / 0.85)' }} />
        <div
          className="absolute w-3 h-3 rounded-full transition-shadow"
          style={{
            left: `calc(${local}% - 6px)`,
            background: 'hsl(var(--foreground))',
            boxShadow: draggingRef.current ? '0 0 0 6px hsl(var(--foreground) / 0.12)' : '0 1px 4px hsl(0 0% 0% / 0.4)',
          }}
        />
      </div>
      <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    </div>
  );
}

export default function SpotifyWidget() {
  const { connected, loading, track, connect, disconnect, play, pause, next, prev, toggleShuffle, cycleRepeat, setVolume, getInterpolatedProgress } = useSpotify();
  const [, force] = useState(0);

  // Light tick for smooth progress only when playing
  useEffect(() => {
    if (!track?.isPlaying) return;
    const id = setInterval(() => force(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [track?.isPlaying]);

  // Detect compact mode based on container width
  const containerRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const h = entries[0].contentRect.height;
      setCompact(w < 280 || h < 220);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!connected) {
    return (
      <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
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
      <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
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

  const accentStyle = (active: boolean): React.CSSProperties =>
    active ? { color: 'hsl(var(--accent))', boxShadow: '0 0 12px hsl(var(--accent) / 0.4)' } : { opacity: 0.55 };

  // ─── COMPACT LAYOUT ───
  if (compact) {
    return (
      <div ref={containerRef} className="flex flex-col h-full w-full p-3 gap-2 min-h-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {track.albumArt ? (
            <img src={track.albumArt} alt={track.album} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--surface-bright))' }}>
              <Music className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate leading-tight">{track.name}</div>
            <div className="text-[0.65rem] text-muted-foreground truncate mt-0.5">{track.artist}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); disconnect(); }}
            className="btn-icon w-6 h-6 opacity-40 shrink-0 bg-transparent"
            title="Disconnect"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>

        <div className="progress-track w-full">
          <div className="progress-fill transition-all duration-700 ease-linear" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>

        <div className="flex items-center justify-between gap-1">
          <button onClick={(e) => { e.stopPropagation(); toggleShuffle(); }} className="btn-icon w-7 h-7 bg-transparent rounded-full" style={accentStyle(track.shuffle)} title="Shuffle">
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="btn-icon w-8 h-8 bg-transparent">
            <SkipBack className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); track.isPlaying ? pause() : play(); }}
            className="btn-icon w-9 h-9 bg-transparent"
          >
            {track.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="btn-icon w-8 h-8 bg-transparent">
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); cycleRepeat(); }} className="btn-icon w-7 h-7 bg-transparent rounded-full" style={accentStyle(track.repeat !== 'off')} title="Repeat">
            {track.repeat === 'track' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // ─── EXPANDED LAYOUT ───
  return (
    <div ref={containerRef} className="flex flex-col h-full w-full p-4 gap-3 min-h-0">
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

      {/* Transport controls — Shuffle | Prev | Play | Next | Repeat */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
          className="btn-icon w-9 h-9 bg-transparent rounded-full"
          style={accentStyle(track.shuffle)}
          title="Shuffle"
        >
          <Shuffle className="w-4 h-4" />
        </button>
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
        <button
          onClick={(e) => { e.stopPropagation(); cycleRepeat(); }}
          className="btn-icon w-9 h-9 bg-transparent rounded-full"
          style={accentStyle(track.repeat !== 'off')}
          title={`Repeat: ${track.repeat}`}
        >
          {track.repeat === 'track' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
        </button>
      </div>

      {/* Volume slider */}
      <VolumeSlider value={track.volume} onChange={setVolume} />
    </div>
  );
}

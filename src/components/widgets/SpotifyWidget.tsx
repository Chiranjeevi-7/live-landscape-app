import { Play, Pause, SkipBack, SkipForward, Music, LogOut } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';

export default function SpotifyWidget() {
  const { connected, loading, track, connect, disconnect, play, pause, next, prev, getInterpolatedProgress } = useSpotify();

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
        <Music className="w-6 h-6 text-muted-foreground" />
        <span className="text-sm text-muted-foreground text-center">
          {loading ? 'Connecting...' : 'Connect Spotify'}
        </span>
        {!loading && (
          <button onClick={(e) => { e.stopPropagation(); connect(); }} className="btn-native accent text-sm">
            Connect
          </button>
        )}
      </div>
    );
  }

  const progress = track ? (getInterpolatedProgress() / track.duration) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      {track ? (
        <>
          <div className="flex items-center gap-3 w-full">
            {track.albumArt ? (
              <img src={track.albumArt} alt={track.album} className="w-11 h-11 rounded-lg object-cover" />
            ) : (
              <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--surface-bright))' }}>
                <Music className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{track.name}</div>
              <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); disconnect(); }}
              className="btn-icon w-7 h-7 opacity-50 hover:opacity-100"
              title="Disconnect"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="btn-icon w-8 h-8"><SkipBack className="w-4 h-4" /></button>
            <button
              onClick={(e) => { e.stopPropagation(); track.isPlaying ? pause() : play(); }}
              className="btn-icon accent w-10 h-10"
            >
              {track.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="btn-icon w-8 h-8"><SkipForward className="w-4 h-4" /></button>
          </div>
        </>
      ) : (
        <span className="text-sm text-muted-foreground text-center">
          Start playing on any device
        </span>
      )}
    </div>
  );
}

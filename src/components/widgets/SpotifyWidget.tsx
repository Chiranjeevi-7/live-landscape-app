import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';

export default function SpotifyWidget() {
  const { connected, loading, track, connect, play, pause, next, prev } = useSpotify();

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
        <span className="t-label">Spotify</span>
        <span className="text-sm text-muted-foreground text-center">
          {loading ? 'Connecting...' : 'Connect your Spotify to control playback'}
        </span>
        {!loading && (
          <button onClick={(e) => { e.stopPropagation(); connect(); }} className="btn-pill text-sm">
            Connect Spotify
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <span className="t-label">Now Playing</span>
      {track ? (
        <>
          <div className="flex items-center gap-3 w-full">
            {track.albumArt ? (
              <img src={track.albumArt} alt={track.album} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--surface-bright))' }}>
                🎵
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{track.name}</div>
              <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="btn-pill p-2"><SkipBack className="w-4 h-4" /></button>
            <button
              onClick={(e) => { e.stopPropagation(); track.isPlaying ? pause() : play(); }}
              className="btn-pill p-2.5"
              style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
            >
              {track.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="btn-pill p-2"><SkipForward className="w-4 h-4" /></button>
          </div>
        </>
      ) : (
        <span className="text-sm text-muted-foreground text-center">
          No track playing — start playback on any Spotify device
        </span>
      )}
    </div>
  );
}

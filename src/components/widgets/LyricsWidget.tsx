import { useEffect, useRef } from 'react';
import { useLyrics } from '@/hooks/useLyrics';
import { useSpotify } from '@/hooks/useSpotify';
import { Music, Loader2 } from 'lucide-react';

export default function LyricsWidget() {
  const { connected, track, getInterpolatedProgress } = useSpotify();
  const { lyrics, currentLineIndex, loading } = useLyrics(track, getInterpolatedProgress);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      const containerH = container.clientHeight;
      const scrollTarget = active.offsetTop - containerH / 2 + active.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: 'smooth',
      });
    }
  }, [currentLineIndex]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
        <Music className="w-6 h-6 text-muted-foreground/50" />
        <span className="text-sm text-muted-foreground text-center">
          Connect Spotify for lyrics
        </span>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
        <Music className="w-6 h-6 text-muted-foreground/50" />
        <span className="text-sm text-muted-foreground text-center">
          Play a song to see lyrics
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        <span className="text-xs text-muted-foreground">Fetching lyrics...</span>
      </div>
    );
  }

  if (!lyrics || lyrics.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
        <Music className="w-6 h-6 text-muted-foreground/30" />
        <span className="text-sm text-muted-foreground text-center">
          No lyrics available
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto scrollbar-hide p-4 relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top/bottom padding for centering effect */}
      <div className="h-[40%]" />

      {lyrics.lines.map((line, i) => {
        const isActive = i === currentLineIndex;
        const isPast = i < currentLineIndex;
        const distance = Math.abs(i - currentLineIndex);

        return (
          <div
            key={i}
            ref={isActive ? activeRef : undefined}
            className="py-1.5 transition-all duration-300"
            style={{
              transitionTimingFunction: 'var(--easing)',
            }}
          >
            <p
              className="text-sm leading-relaxed transition-all duration-300"
              style={{
                color: isActive
                  ? 'hsl(var(--foreground))'
                  : isPast
                    ? 'hsl(var(--muted-foreground) / 0.35)'
                    : 'hsl(var(--muted-foreground) / 0.55)',
                fontWeight: isActive ? 600 : 400,
                fontSize: isActive ? '0.95rem' : '0.85rem',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                transformOrigin: 'left center',
                opacity: distance > 8 ? 0.3 : 1,
                transitionTimingFunction: 'var(--easing)',
              }}
            >
              {line.text}
            </p>
          </div>
        );
      })}

      <div className="h-[40%]" />
    </div>
  );
}

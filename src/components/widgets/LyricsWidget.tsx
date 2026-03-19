import { useSpotify } from '@/hooks/useSpotify';
import { Music } from 'lucide-react';

export default function LyricsWidget() {
  const { connected } = useSpotify();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <span className="t-label">Lyrics</span>
      <Music className="w-8 h-8 text-muted-foreground" />
      <span className="text-sm text-muted-foreground text-center">
        {connected ? 'No track playing' : 'Connect Spotify to see lyrics'}
      </span>
    </div>
  );
}

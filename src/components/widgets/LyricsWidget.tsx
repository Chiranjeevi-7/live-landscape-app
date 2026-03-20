import { useSpotify } from '@/hooks/useSpotify';
import { Music } from 'lucide-react';

export default function LyricsWidget() {
  const { connected } = useSpotify();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <Music className="w-6 h-6 text-muted-foreground/50" />
      <span className="text-sm text-muted-foreground text-center">
        {connected ? 'No track playing' : 'Connect Spotify for lyrics'}
      </span>
    </div>
  );
}

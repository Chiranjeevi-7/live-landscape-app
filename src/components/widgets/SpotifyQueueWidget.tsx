import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Music, ListMusic, Trash2 } from 'lucide-react';
import { useSpotify, type QueueItem } from '@/hooks/useSpotify';

const SWIPE_THRESHOLD = 80;

function QueueRow({
  item,
  compact,
  onRemove,
}: {
  item: QueueItem;
  compact: boolean;
  onRemove: (uri: string) => void;
}) {
  const [dx, setDx] = useState(0);
  const [removing, setRemoving] = useState(false);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    startX.current = e.clientX;
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || startX.current === null) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      setRemoving(true);
      setDx(dx > 0 ? 600 : -600);
      setTimeout(() => onRemove(item.uri), 220);
    } else {
      setDx(0);
    }
    startX.current = null;
  };

  const opacity = removing ? 0 : Math.max(0.25, 1 - Math.abs(dx) / 240);
  const pad = compact ? 'py-1.5' : 'py-2';
  const artSize = compact ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <div
      className="relative overflow-hidden"
      style={{
        maxHeight: removing ? 0 : 80,
        transition: removing ? 'max-height 220ms ease, opacity 220ms ease' : undefined,
      }}
    >
      {/* delete hint backgrounds */}
      <div
        className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none"
        style={{ opacity: Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD) }}
      >
        <Trash2 className="w-4 h-4 text-destructive/70" />
        <Trash2 className="w-4 h-4 text-destructive/70" />
      </div>

      <div
        className={`relative flex items-center gap-3 px-2 ${pad} touch-none select-none`}
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging.current ? 'none' : 'transform 220ms ease, opacity 220ms ease',
          opacity,
          background: 'transparent',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {item.albumArt ? (
          <img
            src={item.albumArt}
            alt=""
            loading="lazy"
            className={`${artSize} rounded-md object-cover shrink-0`}
          />
        ) : (
          <div
            className={`${artSize} rounded-md flex items-center justify-center shrink-0`}
            style={{ background: 'hsl(var(--surface-bright))' }}
          >
            <Music className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-foreground truncate leading-tight`}>
            {item.name}
          </div>
          <div className={`${compact ? 'text-[0.6rem]' : 'text-[0.7rem]'} text-muted-foreground truncate mt-0.5`}>
            {item.artist}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpotifyQueueWidget() {
  const { connected, queue, refreshQueue, next } = useSpotify();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);

  // Compact detection
  const containerRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const h = entries[0].contentRect.height;
      setCompact(w < 260 || h < 240);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset dismissed when underlying queue changes substantially
  useEffect(() => {
    if (dismissed.size === 0) return;
    const valid = new Set(queue.map(q => q.uri));
    let changed = false;
    const nxt = new Set<string>();
    for (const d of dismissed) {
      if (valid.has(d)) nxt.add(d);
      else changed = true;
    }
    if (changed) setDismissed(nxt);
  }, [queue, dismissed]);

  const visible = useMemo(
    () => queue.filter(q => !dismissed.has(q.uri)),
    [queue, dismissed],
  );

  const handleRemove = useCallback((uri: string) => {
    setDismissed(prev => {
      const n = new Set(prev);
      n.add(uri);
      return n;
    });
  }, []);

  const handleClear = useCallback(() => {
    setDismissed(new Set(queue.map(q => q.uri)));
    setConfirmClear(false);
  }, [queue]);

  if (!connected) {
    return (
      <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full gap-2 p-4">
        <ListMusic className="w-6 h-6 text-muted-foreground" />
        <span className="text-xs text-muted-foreground text-center">Connect Spotify to see queue</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-col h-full w-full min-h-0 p-3 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <ListMusic className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">Next in queue</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (visible.length === 0) return;
            setConfirmClear(true);
          }}
          className="text-[0.65rem] text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5"
        >
          Clear queue
        </button>
      </div>

      {/* List */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-1.5 py-6">
            <Music className="w-5 h-5 text-muted-foreground/50" />
            <span className="text-[0.7rem] text-muted-foreground">Queue is empty</span>
            <button
              onClick={(e) => { e.stopPropagation(); refreshQueue(); }}
              className="text-[0.65rem] text-muted-foreground/70 hover:text-foreground mt-1"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {visible.map((item, i) => (
              <div key={item.id}>
                <QueueRow item={item} compact={compact} onRemove={handleRemove} />
                {i < visible.length - 1 && (
                  <div className="mx-3 h-px" style={{ background: 'hsl(var(--border) / 0.5)' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear confirm modal */}
      {confirmClear && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setConfirmClear(false); }}
          style={{ background: 'hsl(var(--background) / 0.6)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="relative w-full max-w-[260px] p-4 rounded-2xl flex flex-col gap-3 animate-scale-in"
            style={{
              background: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 12px 40px -12px hsl(0 0% 0% / 0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold text-foreground">Clear queue?</div>
            <div className="text-xs text-muted-foreground">
              Hides the {visible.length} upcoming track{visible.length === 1 ? '' : 's'} from this view.
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmClear(false); }}
                className="flex-1 text-xs py-2 rounded-lg"
                style={{ background: 'hsl(var(--surface-bright))', color: 'hsl(var(--foreground))' }}
              >
                Cancel
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="flex-1 text-xs py-2 rounded-lg font-medium"
                style={{ background: 'hsl(var(--destructive) / 0.85)', color: 'hsl(var(--destructive-foreground))' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
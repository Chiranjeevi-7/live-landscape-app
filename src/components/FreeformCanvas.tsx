import { useRef, useCallback, useState } from 'react';
import type { WidgetConfig, WidgetShape, WidgetType } from '@/types/dashboard';
import { SHAPE_LABELS, WIDGET_LABELS, generateWidgetId } from '@/types/dashboard';
import WidgetCarousel from '@/components/widgets/WidgetCarousel';
import { X, GripVertical, Maximize2, Plus } from 'lucide-react';

const SNAP = 2;
const MIN_SIZE = 14;

function shapeRadius(shape: WidgetShape): string {
  switch (shape) {
    case 'rectangle': return '6px';
    case 'rounded': return '14px';
    case 'squircle': return '20px';
    case 'circle': return '50%';
    case 'edge-to-edge': return '0';
    default: return '20px';
  }
}

function snap(v: number): number {
  if (v < SNAP) return 0;
  if (v > 100 - SNAP) return 100;
  if (Math.abs(v - 50) < SNAP) return 50;
  return v;
}

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const TYPES: WidgetType[] = ['clock', 'date', 'timer', 'stopwatch', 'spotify', 'lyrics', 'gif', 'weather', 'pomodoro', 'notes', 'lights'];

interface Props {
  widgets: WidgetConfig[];
  editMode: boolean;
  onUpdate: (id: string, updates: Partial<WidgetConfig>) => void;
  onRemove: (id: string) => void;
}

export default function FreeformCanvas({ widgets, editMode, onUpdate, onRemove }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingToId, setAddingToId] = useState<string | null>(null);

  const rect = useCallback(() =>
    canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 },
  []);

  const pct = useCallback((px: number, total: number) => (px / total) * 100, []);

  const handleDrag = useCallback((e: React.PointerEvent, w: WidgetConfig) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveId(w.id);
    const r = rect();
    const sx = e.clientX, sy = e.clientY;
    const ox = w.x, oy = w.y;

    const move = (ev: PointerEvent) => {
      let nx = Math.max(0, Math.min(100 - w.w, ox + pct(ev.clientX - sx, r.width)));
      let ny = Math.max(0, Math.min(100 - w.h, oy + pct(ev.clientY - sy, r.height)));
      nx = snap(nx);
      ny = snap(ny);
      if (nx + w.w > 100 - SNAP) nx = 100 - w.w;
      onUpdate(w.id, { x: nx, y: ny });
    };

    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      setActiveId(null);
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }, [editMode, rect, pct, onUpdate]);

  const handleResize = useCallback((e: React.PointerEvent, w: WidgetConfig, dir: Dir) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveId(w.id);
    const r = rect();
    const sx = e.clientX, sy = e.clientY;
    const orig = { x: w.x, y: w.y, w: w.w, h: w.h };

    const move = (ev: PointerEvent) => {
      const dx = pct(ev.clientX - sx, r.width);
      const dy = pct(ev.clientY - sy, r.height);
      let { x, y, w: nw, h: nh } = orig;

      if (dir.includes('e')) nw = Math.max(MIN_SIZE, orig.w + dx);
      if (dir.includes('w')) { nw = Math.max(MIN_SIZE, orig.w - dx); x = orig.x + orig.w - nw; }
      if (dir.includes('s')) nh = Math.max(MIN_SIZE, orig.h + dy);
      if (dir.includes('n')) { nh = Math.max(MIN_SIZE, orig.h - dy); y = orig.y + orig.h - nh; }

      x = Math.max(0, x);
      y = Math.max(0, y);
      if (x + nw > 100) nw = 100 - x;
      if (y + nh > 100) nh = 100 - y;

      onUpdate(w.id, { x, y, w: nw, h: nh });
    };

    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      setActiveId(null);
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }, [rect, pct, onUpdate]);

  const cycleShape = useCallback((w: WidgetConfig) => {
    const shapes: WidgetShape[] = ['rectangle', 'rounded', 'squircle', 'circle', 'edge-to-edge'];
    onUpdate(w.id, { shape: shapes[(shapes.indexOf(w.shape) + 1) % shapes.length] });
  }, [onUpdate]);

  const addSub = useCallback((wid: string, type: WidgetType) => {
    const w = widgets.find(x => x.id === wid);
    if (!w) return;
    const subs = w.subWidgets || [];
    onUpdate(wid, {
      subWidgets: [...subs, { id: generateWidgetId(type), type }],
      activeSubIndex: subs.length + 1,
    });
    setAddingToId(null);
  }, [widgets, onUpdate]);

  return (
    <div ref={canvasRef} className="relative w-full h-full" style={{ touchAction: editMode ? 'none' : 'auto' }}>
      {widgets.map((w, i) => {
        const active = activeId === w.id;
        const totalSub = 1 + (w.subWidgets?.length || 0);

        return (
          <div
            key={w.id}
            className={`widget-surface absolute ${active ? 'z-50' : 'z-10'} ${editMode ? 'editing' : ''}`}
            style={{
              left: `${w.x}%`,
              top: `${w.y}%`,
              width: `${w.w}%`,
              height: `${w.h}%`,
              borderRadius: shapeRadius(w.shape),
              padding: w.shape === 'edge-to-edge' ? 0 : undefined,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div className="w-full h-full overflow-hidden" style={{ borderRadius: 'inherit' }}>
              <WidgetCarousel
                mainType={w.type}
                subWidgets={w.subWidgets}
                activeIndex={w.activeSubIndex || 0}
                onIndexChange={(idx) => onUpdate(w.id, { activeSubIndex: idx })}
                editMode={editMode}
              />
            </div>

            {editMode && (
              <>
                {/* Drag area */}
                <div
                  className="absolute inset-4 z-20 cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => handleDrag(e, w)}
                />

                {/* Center grip */}
                <GripVertical className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-foreground/15 pointer-events-none z-30" />

                {/* Top controls */}
                <div className="absolute top-2 left-2 right-2 z-30 flex items-center gap-1">
                  <button className="btn-icon w-7 h-7" style={{ background: 'hsl(var(--surface-bright))' }} onClick={(e) => { e.stopPropagation(); cycleShape(w); }}>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button className="btn-icon w-7 h-7" style={{ background: 'hsl(var(--surface-bright))' }} onClick={(e) => { e.stopPropagation(); setAddingToId(addingToId === w.id ? null : w.id); }}>
                    <Plus className="w-3 h-3" />
                  </button>
                  <div className="flex-1" />
                  <button className="btn-icon w-7 h-7" style={{ background: 'hsl(var(--destructive) / 0.15)' }} onClick={(e) => { e.stopPropagation(); onRemove(w.id); }}>
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>

                {/* Info badge */}
                <div className="absolute bottom-2 left-2 z-30 pointer-events-none">
                  <span className="text-[0.55rem] font-medium text-muted-foreground/60">
                    {SHAPE_LABELS[w.shape]}{totalSub > 1 ? ` · ${totalSub}` : ''}
                  </span>
                </div>

                {/* Sub-widget picker dropdown */}
                {addingToId === w.id && (
                  <div
                    className="absolute top-11 left-2 z-40 animate-scale-in"
                    style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '14px', padding: '8px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {TYPES.map(t => (
                        <button key={t} className="btn-native text-[0.65rem] py-1.5 px-2" onClick={() => addSub(w.id, t)}>
                          {WIDGET_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resize handles */}
                {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as Dir[]).map(dir => {
                  const s: React.CSSProperties = {};
                  const cur: Record<Dir, string> = {
                    n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
                    ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
                  };
                  if (dir.includes('n')) { s.top = '-2px'; s.height = '8px'; }
                  if (dir.includes('s')) { s.bottom = '-2px'; s.height = '8px'; }
                  if (dir.includes('e')) { s.right = '-2px'; s.width = '8px'; }
                  if (dir.includes('w')) { s.left = '-2px'; s.width = '8px'; }
                  if (dir === 'n' || dir === 's') { s.left = '8px'; s.right = '8px'; }
                  if (dir === 'e' || dir === 'w') { s.top = '8px'; s.bottom = '8px'; }
                  if (dir.length === 2) { s.width = '14px'; s.height = '14px'; }

                  return (
                    <div
                      key={dir}
                      className="absolute z-30"
                      style={{ ...s, cursor: cur[dir] }}
                      onPointerDown={(e) => handleResize(e, w, dir)}
                    >
                      {dir.length === 2 && (
                        <div className="w-2.5 h-2.5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ background: 'hsl(var(--accent) / 0.5)' }}
                        />
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

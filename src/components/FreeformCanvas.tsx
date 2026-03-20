import { useRef, useCallback, useState } from 'react';
import type { WidgetConfig, WidgetShape, WidgetType } from '@/types/dashboard';
import { SHAPE_LABELS, WIDGET_LABELS, generateWidgetId } from '@/types/dashboard';
import WidgetCarousel from '@/components/widgets/WidgetCarousel';
import { X, Move, Maximize2, Plus } from 'lucide-react';

const SNAP_THRESHOLD = 2;
const MIN_SIZE = 15;

function getShapeStyle(shape: WidgetShape): React.CSSProperties {
  switch (shape) {
    case 'rectangle': return { borderRadius: '4px' };
    case 'rounded': return { borderRadius: '16px' };
    case 'squircle': return { borderRadius: '24px' };
    case 'circle': return { borderRadius: '50%' };
    case 'edge-to-edge': return { borderRadius: '0', padding: '0' };
    default: return { borderRadius: '24px' };
  }
}

function snapValue(v: number): number {
  if (v < SNAP_THRESHOLD) return 0;
  if (v > 100 - SNAP_THRESHOLD) return 100;
  if (Math.abs(v - 50) < SNAP_THRESHOLD) return 50;
  return v;
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const ADDABLE_TYPES: WidgetType[] = ['clock', 'date', 'timer', 'stopwatch', 'spotify', 'lyrics', 'gif', 'weather', 'pomodoro', 'notes'];

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

  const getCanvasRect = useCallback(() => {
    return canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 };
  }, []);

  const toPercent = useCallback((px: number, total: number) => (px / total) * 100, []);

  const handleDragStart = useCallback((e: React.PointerEvent, widget: WidgetConfig) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveId(widget.id);

    const rect = getCanvasRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = widget.x;
    const origY = widget.y;

    const onMove = (ev: PointerEvent) => {
      const dx = toPercent(ev.clientX - startX, rect.width);
      const dy = toPercent(ev.clientY - startY, rect.height);
      let nx = Math.max(0, Math.min(100 - widget.w, origX + dx));
      let ny = Math.max(0, Math.min(100 - widget.h, origY + dy));
      nx = snapValue(nx);
      ny = snapValue(ny);
      if (nx + widget.w > 100 - SNAP_THRESHOLD && nx + widget.w < 100 + SNAP_THRESHOLD) {
        nx = 100 - widget.w;
      }
      onUpdate(widget.id, { x: nx, y: ny });
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      setActiveId(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [editMode, getCanvasRect, toPercent, onUpdate]);

  const handleResize = useCallback((e: React.PointerEvent, widget: WidgetConfig, dir: ResizeDir) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveId(widget.id);

    const rect = getCanvasRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { x: widget.x, y: widget.y, w: widget.w, h: widget.h };

    const onMove = (ev: PointerEvent) => {
      const dx = toPercent(ev.clientX - startX, rect.width);
      const dy = toPercent(ev.clientY - startY, rect.height);

      let { x, y, w, h } = orig;

      if (dir.includes('e')) w = Math.max(MIN_SIZE, orig.w + dx);
      if (dir.includes('w')) { w = Math.max(MIN_SIZE, orig.w - dx); x = orig.x + orig.w - w; }
      if (dir.includes('s')) h = Math.max(MIN_SIZE, orig.h + dy);
      if (dir.includes('n')) { h = Math.max(MIN_SIZE, orig.h - dy); y = orig.y + orig.h - h; }

      x = Math.max(0, x);
      y = Math.max(0, y);
      if (x + w > 100) w = 100 - x;
      if (y + h > 100) h = 100 - y;

      onUpdate(widget.id, { x, y, w, h });
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      setActiveId(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [getCanvasRect, toPercent, onUpdate]);

  const cycleShape = useCallback((widget: WidgetConfig) => {
    const shapes: WidgetShape[] = ['rectangle', 'rounded', 'squircle', 'circle', 'edge-to-edge'];
    const idx = shapes.indexOf(widget.shape);
    onUpdate(widget.id, { shape: shapes[(idx + 1) % shapes.length] });
  }, [onUpdate]);

  const addSubWidget = useCallback((widgetId: string, type: WidgetType) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    const sub = { id: generateWidgetId(type), type };
    const currentSubs = widget.subWidgets || [];
    onUpdate(widgetId, {
      subWidgets: [...currentSubs, sub],
      activeSubIndex: currentSubs.length + 1,
    });
    setAddingToId(null);
  }, [widgets, onUpdate]);

  const removeSubWidget = useCallback((widgetId: string, subIndex: number) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || !widget.subWidgets) return;
    const newSubs = widget.subWidgets.filter((_, i) => i !== subIndex);
    const currentActive = widget.activeSubIndex || 0;
    onUpdate(widgetId, {
      subWidgets: newSubs,
      activeSubIndex: Math.min(currentActive, newSubs.length),
    });
  }, [widgets, onUpdate]);

  return (
    <div ref={canvasRef} className="relative w-full h-full" style={{ touchAction: editMode ? 'none' : 'auto' }}>
      {widgets.map(widget => {
        const isActive = activeId === widget.id;
        const shapeStyle = getShapeStyle(widget.shape);
        const totalWidgets = 1 + (widget.subWidgets?.length || 0);

        return (
          <div
            key={widget.id}
            className={`widget-panel absolute overflow-hidden ${isActive ? 'z-50' : 'z-10'} ${editMode ? 'ring-1 ring-accent/30' : ''}`}
            style={{
              left: `${widget.x}%`,
              top: `${widget.y}%`,
              width: `${widget.w}%`,
              height: `${widget.h}%`,
              ...shapeStyle,
            }}
          >
            <div className="w-full h-full">
              <WidgetCarousel
                mainType={widget.type}
                subWidgets={widget.subWidgets}
                activeIndex={widget.activeSubIndex || 0}
                onIndexChange={(idx) => onUpdate(widget.id, { activeSubIndex: idx })}
                editMode={editMode}
              />
            </div>

            {editMode && (
              <>
                {/* Drag handle */}
                <div className="absolute inset-0 z-20">
                  <div
                    className="absolute inset-4 cursor-move"
                    onPointerDown={(e) => handleDragStart(e, widget)}
                  />
                </div>

                {/* Move icon */}
                <Move className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-foreground/20 pointer-events-none z-30" />

                {/* Shape toggle */}
                <button className="absolute top-2 left-2 z-30 btn-pill text-[0.6rem] py-1 px-2" onClick={(e) => { e.stopPropagation(); cycleShape(widget); }}>
                  <Maximize2 className="w-3 h-3" />
                </button>

                {/* Add sub-widget */}
                <button className="absolute top-2 right-8 z-30 btn-pill text-[0.6rem] py-1 px-2" onClick={(e) => { e.stopPropagation(); setAddingToId(addingToId === widget.id ? null : widget.id); }}>
                  <Plus className="w-3 h-3" />
                </button>

                {/* Remove */}
                <button className="absolute top-2 right-2 z-30 btn-pill text-[0.6rem] py-1 px-1.5" onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}>
                  <X className="w-3 h-3" />
                </button>

                {/* Shape label */}
                <div className="absolute bottom-2 left-2 z-30 pointer-events-none">
                  <span className="text-[0.55rem] text-muted-foreground">
                    {SHAPE_LABELS[widget.shape]}{totalWidgets > 1 ? ` · ${totalWidgets} widgets` : ''}
                  </span>
                </div>

                {/* Add sub-widget dropdown */}
                {addingToId === widget.id && (
                  <div className="absolute top-10 right-2 z-40 rounded-xl p-2" style={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}>
                    <div className="grid grid-cols-2 gap-1" onClick={(e) => e.stopPropagation()}>
                      {ADDABLE_TYPES.map(t => (
                        <button key={t} className="btn-pill text-[0.6rem] py-1 px-2" onClick={() => addSubWidget(widget.id, t)}>
                          {WIDGET_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resize handles */}
                {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as ResizeDir[]).map(dir => {
                  const posStyle: React.CSSProperties = {};
                  const cursorMap: Record<ResizeDir, string> = {
                    n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
                    ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
                  };

                  if (dir.includes('n')) { posStyle.top = '-3px'; posStyle.height = '8px'; }
                  if (dir.includes('s')) { posStyle.bottom = '-3px'; posStyle.height = '8px'; }
                  if (dir.includes('e')) { posStyle.right = '-3px'; posStyle.width = '8px'; }
                  if (dir.includes('w')) { posStyle.left = '-3px'; posStyle.width = '8px'; }

                  if (dir === 'n' || dir === 's') { posStyle.left = '8px'; posStyle.right = '8px'; }
                  if (dir === 'e' || dir === 'w') { posStyle.top = '8px'; posStyle.bottom = '8px'; }

                  if (dir.length === 2) {
                    posStyle.width = '12px';
                    posStyle.height = '12px';
                  }

                  return (
                    <div
                      key={dir}
                      className="absolute z-30"
                      style={{ ...posStyle, cursor: cursorMap[dir] }}
                      onPointerDown={(e) => handleResize(e, widget, dir)}
                    >
                      {dir.length === 2 && (
                        <div className="w-2 h-2 rounded-full bg-accent/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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

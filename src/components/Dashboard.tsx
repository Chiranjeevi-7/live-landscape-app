import { useState, useCallback, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import AmbientVisualizer from '@/components/AmbientVisualizer';
import FreeformCanvas from '@/components/FreeformCanvas';
import WidgetPicker from '@/components/WidgetPicker';
import { Palette, Paintbrush, Lock, Unlock, Plus } from 'lucide-react';

export default function Dashboard() {
  const { layout, accentIndex, updateWidget, addWidget, removeWidget, cycleTheme, cycleAccent } = useDashboardStore();
  const [showUI, setShowUI] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  const uiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wake lock
  useEffect(() => {
    let wl: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) {
          wl = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        }
      } catch { /* fallback */ }
    };
    acquire();
    const onVisibility = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); wl?.release(); };
  }, []);

  // Auto-dim
  useEffect(() => {
    const check = () => { const h = new Date().getHours(); setDimmed(h >= 23 || h < 6); };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  const handleTap = useCallback(() => {
    if (editMode) return;
    setShowUI(true);
    if (uiTimeout.current) clearTimeout(uiTimeout.current);
    uiTimeout.current = setTimeout(() => setShowUI(false), 3000);
  }, [editMode]);

  return (
    <div className={`fixed inset-0 bg-background overflow-hidden ${dimmed ? 'auto-dimmed' : ''}`} onClick={handleTap}>
      <AmbientVisualizer accentIndex={accentIndex} />

      {/* Edit mode indicator */}
      {editMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 overlay-pill px-4 py-2 text-xs text-foreground/80">
          Edit Mode — Drag to move, corners to resize
        </div>
      )}

      {/* Free-form canvas */}
      <FreeformCanvas widgets={layout.widgets} editMode={editMode} onUpdate={updateWidget} onRemove={removeWidget} />

      {/* Control bar */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showUI || editMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="overlay-pill flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); cycleTheme(); }} className="btn-pill flex items-center gap-1.5 py-2 px-3">
            <Palette className="w-4 h-4" /> Theme
          </button>
          <button onClick={(e) => { e.stopPropagation(); cycleAccent(); }} className="btn-pill flex items-center gap-1.5 py-2 px-3">
            <Paintbrush className="w-4 h-4" /> Color
          </button>
          <button onClick={(e) => { e.stopPropagation(); setEditMode(!editMode); if (editMode) setShowPicker(false); }} className="btn-pill flex items-center gap-1.5 py-2 px-3" style={editMode ? { background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' } : {}}>
            {editMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {editMode ? 'Done' : 'Edit'}
          </button>
          {editMode && (
            <button onClick={(e) => { e.stopPropagation(); setShowPicker(true); }} className="btn-pill flex items-center gap-1.5 py-2 px-3" style={{ background: 'hsl(var(--accent) / 0.2)', borderColor: 'hsl(var(--accent) / 0.4)' }}>
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>
      </div>
      {showPicker && (
        <WidgetPicker onAdd={(widget) => { addWidget(widget); setShowPicker(false); }} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}

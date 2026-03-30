import { useState, useCallback, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import AmbientVisualizer from '@/components/AmbientVisualizer';
import FreeformCanvas from '@/components/FreeformCanvas';
import WidgetPicker from '@/components/WidgetPicker';
import { Palette, Lock, Unlock, Plus, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function Dashboard() {
  const { layout, accentIndex, brightness, updateWidget, addWidget, removeWidget, cycleTheme, setBrightness } = useDashboardStore();
  const [showUI, setShowUI] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const uiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wake lock
  useEffect(() => {
    let wl: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) {
          wl = await (navigator as any).wakeLock.request('screen');
        }
      } catch { /* fallback */ }
    };
    acquire();
    const onVisibility = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); wl?.release(); };
  }, []);

  const handleTap = useCallback(() => {
    if (editMode) return;
    setShowUI(true);
    if (uiTimeout.current) clearTimeout(uiTimeout.current);
    uiTimeout.current = setTimeout(() => setShowUI(false), 5000);
  }, [editMode]);

  const visibleWidgets = focusMode
    ? layout.widgets.filter(w => w.type === 'clock' || w.type === 'date' || w.type === 'pomodoro')
    : layout.widgets;

  const visible = showUI || editMode;

  return (
    <div
      className="fixed inset-0 bg-background overflow-hidden"
      style={{ filter: `brightness(${brightness / 100})` }}
      onClick={handleTap}
    >
      <AmbientVisualizer accentIndex={accentIndex} />

      {/* Edit mode indicator */}
      {editMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-fade-up">
          <div className="control-dock px-5 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              Drag to move · Corners to resize
            </span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="w-full h-full">
        <FreeformCanvas
          widgets={visibleWidgets}
          editMode={editMode}
          onUpdate={updateWidget}
          onRemove={removeWidget}
        />
      </div>

      {/* ─── TOP-LEFT: Theme ─── */}
      <div
        className={`corner-btn top-4 left-4 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); cycleTheme(); }}
          className="btn-icon"
          title="Theme"
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>

      {/* ─── TOP-RIGHT: Focus Mode ─── */}
      <div
        className={`corner-btn top-4 right-4 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setFocusMode(!focusMode); }}
          className={`btn-icon ${focusMode ? 'accent' : ''}`}
          title="Focus Mode"
        >
          {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── BOTTOM-LEFT: Brightness slider ─── */}
      <div
        className={`corner-btn bottom-4 left-4 flex items-center gap-3 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <Moon className="w-3.5 h-3.5 text-muted-foreground" />
        <Slider
          value={[brightness]}
          min={20}
          max={100}
          step={5}
          onValueChange={(v) => setBrightness(v[0])}
          className="w-28"
          onClick={(e) => e.stopPropagation()}
        />
        <Sun className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      {/* ─── BOTTOM-RIGHT: Edit / Add ─── */}
      <div
        className={`corner-btn bottom-4 right-4 flex items-center gap-2 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setEditMode(!editMode); if (editMode) setShowPicker(false); }}
          className={`btn-icon ${editMode ? 'accent' : ''}`}
          title={editMode ? 'Done' : 'Edit'}
        >
          {editMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>

        {editMode && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowPicker(true); }}
            className="btn-icon accent"
            title="Add Widget"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {showPicker && (
        <WidgetPicker
          onAdd={(widget) => { addWidget(widget); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

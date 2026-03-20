import { useState, useCallback, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import AmbientVisualizer from '@/components/AmbientVisualizer';
import FreeformCanvas from '@/components/FreeformCanvas';
import WidgetPicker from '@/components/WidgetPicker';
import { Palette, Paintbrush, Lock, Unlock, Plus, Eye, EyeOff } from 'lucide-react';

export default function Dashboard() {
  const { layout, accentIndex, updateWidget, addWidget, removeWidget, cycleTheme, cycleAccent } = useDashboardStore();
  const [showUI, setShowUI] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [dimmed, setDimmed] = useState(false);
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
    uiTimeout.current = setTimeout(() => setShowUI(false), 4000);
  }, [editMode]);

  // In focus mode, only show clock widgets
  const visibleWidgets = focusMode
    ? layout.widgets.filter(w => w.type === 'clock' || w.type === 'date' || w.type === 'pomodoro')
    : layout.widgets;

  return (
    <div
      className={`fixed inset-0 bg-background overflow-hidden ${dimmed ? 'auto-dimmed' : ''}`}
      onClick={handleTap}
    >
      <AmbientVisualizer accentIndex={accentIndex} />

      {/* Edit mode indicator */}
      {editMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
          <div className="control-dock px-5 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              Drag to move · Corners to resize
            </span>
          </div>
        </div>
      )}

      {/* Free-form canvas */}
      <div
        className="w-full h-full transition-opacity duration-700"
        style={{ opacity: focusMode ? 1 : 1 }}
      >
        <FreeformCanvas
          widgets={visibleWidgets}
          editMode={editMode}
          onUpdate={updateWidget}
          onRemove={removeWidget}
        />
      </div>

      {/* Control dock */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          showUI || editMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        style={{ transitionTimingFunction: 'var(--easing)' }}
      >
        <div className="control-dock">
          <button
            onClick={(e) => { e.stopPropagation(); cycleTheme(); }}
            className="btn-icon"
            title="Theme"
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); cycleAccent(); }}
            className="btn-icon"
            title="Color"
          >
            <Paintbrush className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button
            onClick={(e) => { e.stopPropagation(); setFocusMode(!focusMode); }}
            className={`btn-icon ${focusMode ? 'accent' : ''}`}
            title="Focus Mode"
          >
            {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

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

import { X } from 'lucide-react';
import { WidgetType, WidgetConfig, WIDGET_LABELS, generateWidgetId } from '@/types/dashboard';

const ALL_TYPES: WidgetType[] = ['clock', 'date', 'timer', 'stopwatch', 'spotify', 'lyrics', 'gif', 'weather', 'pomodoro', 'notes', 'lights'];

const ICONS: Record<WidgetType, string> = {
  clock: '⏰', date: '📅', timer: '⏱️', stopwatch: '🏃', spotify: '🎵',
  lyrics: '📝', gif: '🖼️', weather: '🌤️', pomodoro: '🍅', notes: '📋', lights: '💡',
};

interface Props {
  onAdd: (widget: WidgetConfig) => void;
  onClose: () => void;
}

export default function WidgetPicker({ onAdd, onClose }: Props) {
  const handleAdd = (type: WidgetType) => {
    onAdd({
      id: generateWidgetId(type),
      type,
      x: 10 + Math.random() * 20,
      y: 10 + Math.random() * 20,
      w: 28,
      h: 45,
      shape: 'squircle',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'hsl(var(--background) / 0.7)', backdropFilter: 'blur(8px)' }} />

      {/* Panel */}
      <div
        className="relative animate-scale-in"
        style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '20px',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '400px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Add Widget</h3>
          <button className="btn-icon w-7 h-7" style={{ background: 'hsl(var(--surface-bright))' }} onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ALL_TYPES.map((type, i) => (
            <button
              key={type}
              onClick={() => handleAdd(type)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
              style={{
                background: 'hsl(var(--surface-bright))',
                border: '1px solid hsl(var(--border))',
                animationDelay: `${i * 30}ms`,
              }}
            >
              <span className="text-lg">{ICONS[type]}</span>
              <span className="text-sm font-medium text-foreground">{WIDGET_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

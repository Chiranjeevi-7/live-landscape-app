import { X } from 'lucide-react';
import { WidgetType, WidgetConfig, WIDGET_LABELS, generateWidgetId } from '@/types/dashboard';

const ALL_TYPES: WidgetType[] = ['clock', 'date', 'timer', 'stopwatch', 'spotify', 'lyrics', 'gif', 'weather', 'pomodoro', 'notes'];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'hsl(0 0% 0% / 0.6)' }}>
      <div className="absolute inset-0" onClick={(e) => { e.stopPropagation(); onClose(); }}>
        <X className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-foreground/60 hover:text-foreground" />
      </div>
      <div className="relative rounded-2xl p-6" style={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Add Widget</h3>
        <div className="grid grid-cols-3 gap-2">
          {ALL_TYPES.map(type => (
            <button key={type} onClick={() => handleAdd(type)} className="btn-pill text-xs py-3 px-2 text-center">
              {WIDGET_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

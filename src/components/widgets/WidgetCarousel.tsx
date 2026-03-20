import { useRef, useCallback } from 'react';
import type { WidgetType, SubWidget } from '@/types/dashboard';
import WidgetRenderer from './WidgetRenderer';

interface Props {
  mainType: WidgetType;
  subWidgets?: SubWidget[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  editMode: boolean;
}

export default function WidgetCarousel({ mainType, subWidgets, activeIndex, onIndexChange, editMode }: Props) {
  const touchX = useRef<number | null>(null);
  const delta = useRef(0);

  const all: WidgetType[] = [mainType, ...(subWidgets?.map(s => s.type) || [])];
  const total = all.length;
  const idx = Math.min(activeIndex, total - 1);

  const go = useCallback((i: number) => onIndexChange(Math.max(0, Math.min(total - 1, i))), [total, onIndexChange]);

  const onStart = (x: number) => { if (!editMode) { touchX.current = x; delta.current = 0; } };
  const onMove = (x: number) => { if (touchX.current !== null) delta.current = x - touchX.current; };
  const onEnd = () => {
    if (editMode || touchX.current === null) return;
    if (Math.abs(delta.current) > 40) {
      if (delta.current < 0 && idx < total - 1) go(idx + 1);
      else if (delta.current > 0 && idx > 0) go(idx - 1);
    }
    touchX.current = null;
    delta.current = 0;
  };

  if (total <= 1) return <WidgetRenderer type={mainType} />;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onTouchStart={(e) => onStart(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={onEnd}
      onMouseDown={(e) => { if (!editMode && total > 1) onStart(e.clientX); }}
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseUp={onEnd}
    >
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${idx * 100}%)`,
          width: `${total * 100}%`,
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {all.map((type, i) => (
          <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / total}%` }}>
            <WidgetRenderer type={type} />
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {all.map((_, i) => (
          <button
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === idx ? '16px' : '5px',
              height: '5px',
              background: i === idx ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.15)',
            }}
            onClick={(e) => { e.stopPropagation(); go(i); }}
          />
        ))}
      </div>
    </div>
  );
}

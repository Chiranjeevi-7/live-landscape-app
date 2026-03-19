import { useState, useRef, useCallback } from 'react';
import type { WidgetType, SubWidget } from '@/types/dashboard';
import WidgetRenderer from './WidgetRenderer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  mainType: WidgetType;
  subWidgets?: SubWidget[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  editMode: boolean;
}

export default function WidgetCarousel({ mainType, subWidgets, activeIndex, onIndexChange, editMode }: Props) {
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const [swiping, setSwiping] = useState(false);

  const allTypes: WidgetType[] = [mainType, ...(subWidgets?.map(sw => sw.type) || [])];
  const total = allTypes.length;
  const currentIndex = Math.min(activeIndex, total - 1);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(total - 1, idx));
    onIndexChange(clamped);
  }, [total, onIndexChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (editMode) return;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || editMode) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (editMode) return;
    setSwiping(false);
    if (Math.abs(touchDeltaX.current) > 40) {
      if (touchDeltaX.current < 0 && currentIndex < total - 1) {
        goTo(currentIndex + 1);
      } else if (touchDeltaX.current > 0 && currentIndex > 0) {
        goTo(currentIndex - 1);
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const mouseStartX = useRef<number | null>(null);
  const mouseDeltaX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editMode || total <= 1) return;
    mouseStartX.current = e.clientX;
    mouseDeltaX.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStartX.current === null || editMode) return;
    mouseDeltaX.current = e.clientX - mouseStartX.current;
  };

  const handleMouseUp = () => {
    if (editMode || mouseStartX.current === null) return;
    if (Math.abs(mouseDeltaX.current) > 40) {
      if (mouseDeltaX.current < 0 && currentIndex < total - 1) {
        goTo(currentIndex + 1);
      } else if (mouseDeltaX.current > 0 && currentIndex > 0) {
        goTo(currentIndex - 1);
      }
    }
    mouseStartX.current = null;
    mouseDeltaX.current = 0;
  };

  if (total <= 1) {
    return <WidgetRenderer type={mainType} />;
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="flex h-full transition-transform duration-300" style={{ transform: `translateX(-${currentIndex * 100}%)`, width: `${total * 100}%` }}>
        {allTypes.map((type, i) => (
          <div key={i} className="w-full h-full flex-shrink-0" style={{ width: `${100 / total}%` }}>
            <WidgetRenderer type={type} />
          </div>
        ))}
      </div>

      {!editMode && currentIndex > 0 && (
        <button className="absolute left-1 top-1/2 -translate-y-1/2 btn-pill p-1 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {!editMode && currentIndex < total - 1 && (
        <button className="absolute right-1 top-1/2 -translate-y-1/2 btn-pill p-1 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {allTypes.map((_, i) => (
          <button key={i} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === currentIndex ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.2)' }} onClick={(e) => { e.stopPropagation(); goTo(i); }} />
        ))}
      </div>
    </div>
  );
}

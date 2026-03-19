import { useMemo } from 'react';
import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';

const DIGIT_MAP: Record<string, number[][]> = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
  '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
  ':': [[0],[1],[0],[1],[0]],
};

export default function DotMatrix({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const dotSize = Math.max(3, 4 * settings.fontSize);
  const gap = Math.max(1, 1.5 * settings.fontSize);

  const chars = t.formatted.split('');

  const grid = useMemo(() => {
    return chars.map((ch, ci) => {
      const pattern = DIGIT_MAP[ch];
      if (!pattern) return null;
      return (
        <div key={ci} className="flex flex-col items-center" style={{ gap: `${gap}px`, marginLeft: ci > 0 ? '6px' : '0' }}>
          {pattern.map((row, ri) => (
            <div key={ri} className="flex" style={{ gap: `${gap}px` }}>
              {row.map((dot, di) => (
                <div key={di} style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  borderRadius: '50%',
                  background: dot ? 'hsl(var(--accent))' : 'hsl(var(--surface))',
                  boxShadow: dot && settings.glowEffect ? '0 0 4px hsl(var(--accent) / 0.5)' : 'none',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
          ))}
        </div>
      );
    });
  }, [chars, dotSize, gap, settings.glowEffect]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3">
      <div className="flex items-center">{grid}</div>
      {settings.showDate && (
        <div className="text-center">
          <span className="t-label">{t.dateFormatted}</span>
        </div>
      )}
    </div>
  );
}

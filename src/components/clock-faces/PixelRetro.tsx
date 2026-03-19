import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';

export default function PixelRetro({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const size = `${2 * settings.fontSize}rem`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2" style={{ fontFamily: '"Courier New", monospace' }}>
      <div className="flex items-baseline gap-2">
        <span className="t-display" style={{ fontSize: size, letterSpacing: '0.15em' }}>{t.formatted}</span>
        {settings.showAmPm && settings.hour12 && (
          <span className="text-muted-foreground text-xs">{t.ampm}</span>
        )}
      </div>
      {settings.showDate && (
        <div className="text-center">
          <span className="t-label" style={{ fontFamily: '"Courier New", monospace' }}>{'>'} {t.dateFormatted}</span>
        </div>
      )}
    </div>
  );
}

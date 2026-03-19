import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';
import { FONT_FAMILIES } from '@/types/clock';

export default function FuturisticNeon({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const font = FONT_FAMILIES[settings.font];
  const size = `${2.8 * settings.fontSize}rem`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <span className="t-display" style={{ fontFamily: font, fontSize: size, textShadow: settings.glowEffect ? '0 0 20px hsl(var(--accent) / 0.6), 0 0 40px hsl(var(--accent) / 0.3)' : 'none' }}>
        {t.formatted}
      </span>
      {settings.showAmPm && settings.hour12 && (
        <span className="text-muted-foreground text-sm mt-1">{t.ampm}</span>
      )}
      {settings.showDate && (
        <span className="t-label mt-2">{t.dateFormatted}</span>
      )}
    </div>
  );
}

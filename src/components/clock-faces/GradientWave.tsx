import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';
import { FONT_FAMILIES } from '@/types/clock';

export default function GradientWave({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const font = FONT_FAMILIES[settings.font];
  const size = `${3 * settings.fontSize}rem`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <span style={{ fontFamily: font, fontSize: size, fontWeight: 700, background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--foreground)), hsl(var(--accent)))', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'gradientShift 4s ease infinite', lineHeight: 1 }}>
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

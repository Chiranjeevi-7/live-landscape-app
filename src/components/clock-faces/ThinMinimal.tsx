import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';
import { FONT_FAMILIES } from '@/types/clock';

export default function ThinMinimal({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const font = FONT_FAMILIES[settings.font];
  const size = `${2.5 * settings.fontSize}rem`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-1">
      <span className="t-display" style={{ fontFamily: font, fontSize: size, fontWeight: 200, letterSpacing: '0.1em' }}>
        {t.formatted}
      </span>
      {settings.showAmPm && settings.hour12 && (
        <span className="text-muted-foreground text-xs">{t.ampm}</span>
      )}
      {settings.showDate && (
        <span className="t-label" style={{ fontWeight: 300 }}>{t.dateFormatted}</span>
      )}
    </div>
  );
}

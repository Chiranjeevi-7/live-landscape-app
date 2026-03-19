import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';
import { FONT_FAMILIES } from '@/types/clock';

export default function BoldTypo({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const font = FONT_FAMILIES[settings.font];
  const size = `${3.5 * settings.fontSize}rem`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <span className="t-display" style={{ fontFamily: font, fontSize: size, fontWeight: 900 }}>{t.formatted}</span>
      {settings.showAmPm && settings.hour12 && (
        <span className="text-muted-foreground text-lg mt-1">{t.ampm}</span>
      )}
      {settings.showDate && (
        <span className="t-label mt-2">{t.dateFormatted}</span>
      )}
    </div>
  );
}

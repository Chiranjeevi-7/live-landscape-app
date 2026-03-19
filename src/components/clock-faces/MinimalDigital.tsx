import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';
import { FONT_FAMILIES } from '@/types/clock';

export default function MinimalDigital({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const font = FONT_FAMILIES[settings.font];
  const size = `${2.5 * settings.fontSize}rem`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2">
      <div className="flex items-baseline gap-2">
        <span className="t-display" style={{ fontFamily: font, fontSize: size }}>{t.formatted}</span>
        {settings.showAmPm && settings.hour12 && (
          <span className="text-muted-foreground text-sm">{t.ampm}</span>
        )}
      </div>
      {settings.showDate && (
        <div className="text-center">
          <span className="t-label">{t.dateFormatted}</span>
        </div>
      )}
    </div>
  );
}

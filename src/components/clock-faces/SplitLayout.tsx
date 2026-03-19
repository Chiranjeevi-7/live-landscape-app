import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';
import { FONT_FAMILIES } from '@/types/clock';

export default function SplitLayout({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const font = FONT_FAMILIES[settings.font];
  const size = `${2.2 * settings.fontSize}rem`;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const displayH = settings.hour12 ? t.h12 : t.hours;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <span className="t-display" style={{ fontFamily: font, fontSize: size }}>{pad(displayH)}</span>
          <span className="t-label text-[0.6rem]">HRS</span>
        </div>
        <span className="t-display" style={{ fontFamily: font, fontSize: size, opacity: 0.4 }}>:</span>
        <div className="flex flex-col items-center">
          <span className="t-display" style={{ fontFamily: font, fontSize: size }}>{pad(t.minutes)}</span>
          <span className="t-label text-[0.6rem]">MIN</span>
        </div>
        {settings.showSeconds && (
          <>
            <span className="t-display" style={{ fontFamily: font, fontSize: size, opacity: 0.4 }}>:</span>
            <div className="flex flex-col items-center">
              <span className="t-display" style={{ fontFamily: font, fontSize: size }}>{pad(t.seconds)}</span>
              <span className="t-label text-[0.6rem]">SEC</span>
            </div>
          </>
        )}
      </div>
      {(settings.showDate || (settings.showAmPm && settings.hour12)) && (
        <div className="flex items-center gap-2">
          {settings.showAmPm && settings.hour12 && (
            <span className="text-muted-foreground text-xs">{t.ampm}</span>
          )}
          {settings.showDate && (
            <span className="t-label">{t.dateFormatted}</span>
          )}
        </div>
      )}
    </div>
  );
}

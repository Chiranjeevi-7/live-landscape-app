import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';
import { FONT_FAMILIES } from '@/types/clock';

export default function GlassClock({ settings }: { settings: ClockSettings }) {
  const t = useClockTime(settings);
  const font = FONT_FAMILIES[settings.font];
  const size = `${2.8 * settings.fontSize}rem`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="rounded-2xl px-6 py-4" style={{ background: 'hsl(var(--surface-bright))', backdropFilter: 'blur(8px)' }}>
        <span className="t-display" style={{ fontFamily: font, fontSize: size }}>{t.formatted}</span>
        {settings.showAmPm && settings.hour12 && (
          <span className="text-muted-foreground text-sm ml-2">{t.ampm}</span>
        )}
      </div>
      {settings.showDate && (
        <div className="text-center mt-3">
          <span className="t-label">{t.dateFormatted}</span>
        </div>
      )}
    </div>
  );
}

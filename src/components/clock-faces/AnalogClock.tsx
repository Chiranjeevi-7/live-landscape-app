import type { ClockSettings } from '@/types/clock';
import { useClockTime } from './useClockTime';

export default function AnalogClock({ settings }: { settings: ClockSettings }) {
  const t = useClockTime({ ...settings, showSeconds: true });
  const size = Math.min(120, 90 * settings.fontSize);

  const hourAngle = ((t.hours % 12) + t.minutes / 60) * 30;
  const minuteAngle = (t.minutes + t.seconds / 60) * 6;
  const secondAngle = t.seconds * 6;

  const r = size / 2;
  const cx = r;
  const cy = r;

  const hand = (angle: number, length: number, width: number, color: string) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    const x2 = cx + length * Math.cos(rad);
    const y2 = cy + length * Math.sin(rad);
    return <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };

  const markers = Array.from({ length: 12 }, (_, i) => {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    const outer = r - 4;
    const inner = i % 3 === 0 ? r - 12 : r - 8;
    return (
      <line key={i} x1={cx + inner * Math.cos(angle)} y1={cy + inner * Math.sin(angle)} x2={cx + outer * Math.cos(angle)} y2={cy + outer * Math.sin(angle)} stroke="hsl(var(--foreground) / 0.3)" strokeWidth={i % 3 === 0 ? 2 : 1} />
    );
  });

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {markers}
        {hand(hourAngle, r * 0.5, 3, 'hsl(var(--foreground))')}
        {hand(minuteAngle, r * 0.7, 2, 'hsl(var(--foreground) / 0.8)')}
        {settings.showSeconds && hand(secondAngle, r * 0.78, 1, 'hsl(var(--accent))')}
        <circle cx={cx} cy={cy} r={3} fill="hsl(var(--accent))" />
        {settings.glowEffect && (
          <circle cx={cx} cy={cy} r={r * 0.8} fill="none" stroke="hsl(var(--accent) / 0.1)" strokeWidth={1} />
        )}
      </svg>
      {settings.showDate && (
        <div className="text-center">
          <span className="t-label">{t.dateFormatted}</span>
        </div>
      )}
    </div>
  );
}

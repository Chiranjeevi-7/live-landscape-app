import { useState, useEffect } from 'react';
import type { ClockSettings } from '@/types/clock';

export interface ClockTimeData {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  dateFormatted: string;
  ampm: string;
  h12: number;
}

export function useClockTime(settings: ClockSettings): ClockTimeData {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [settings.showSeconds]);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const h12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const displayH = settings.hour12 ? h12 : hours;

  let formatted = `${pad(displayH)}:${pad(minutes)}`;
  if (settings.showSeconds) formatted += `:${pad(seconds)}`;

  const dateFormatted = now.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return { hours, minutes, seconds, formatted, dateFormatted, ampm, h12 };
}

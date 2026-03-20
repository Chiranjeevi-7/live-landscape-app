import { useState, useEffect } from 'react';

export default function DateWidget() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const weekday = date.toLocaleDateString([], { weekday: 'long' });
  const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const year = date.getFullYear();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-1 p-4">
      <span className="t-label">{weekday}</span>
      <span className="t-display text-2xl">{monthDay}</span>
      <span className="text-xs text-muted-foreground mt-1">{year}</span>
    </div>
  );
}

import { useState, useEffect } from 'react';

export default function DateWidget() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const formatted = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4">
      <span className="t-label">Today</span>
      <span className="t-display text-2xl">{formatted}</span>
    </div>
  );
}

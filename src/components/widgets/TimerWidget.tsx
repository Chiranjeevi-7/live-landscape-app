import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'monolith_timer_default';

function fmt(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerWidget() {
  const [base, setBase] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(STORAGE_KEY) || '300', 10);
    return Number.isFinite(v) && v > 0 ? v : 300;
  });
  const [seconds, setSeconds] = useState(base);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(base)); }, [base]);

  const start = useCallback(() => {
    if (seconds <= 0) return;
    setRunning(true);
    ref.current = setInterval(() => {
      setSeconds(p => {
        if (p <= 1) { clearInterval(ref.current!); setRunning(false); return 0; }
        return p - 1;
      });
    }, 1000);
  }, [seconds]);

  const pause = useCallback(() => { if (ref.current) clearInterval(ref.current); setRunning(false); }, []);
  const reset = useCallback(() => { if (ref.current) clearInterval(ref.current); setRunning(false); setSeconds(base); }, [base]);

  const progress = base > 0 ? ((base - seconds) / base) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <span className="t-label">Timer</span>
      <div className="progress-track w-full max-w-[200px]">
        <div className="progress-fill transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <span className="t-display text-2xl tabular-nums tracking-tight">{fmt(seconds)}</span>
      <div className="flex gap-2">
        {!running ? (
          <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-icon accent w-10 h-10">
            <Play className="w-5 h-5 ml-0.5" />
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); pause(); }} className="btn-icon accent w-10 h-10">
            <Pause className="w-5 h-5" />
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); reset(); }} className="btn-icon w-10 h-10">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      {!running && (
        <div className="flex gap-1.5 flex-wrap justify-center">
          {[60, 300, 600, 1500, 3600].map(v => (
            <button
              key={v}
              onClick={(e) => { e.stopPropagation(); setBase(v); setSeconds(v); }}
              className="btn-native text-[0.65rem] py-1 px-2.5"
              style={base === v ? { background: 'hsl(var(--accent) / 0.2)', borderColor: 'hsl(var(--accent) / 0.4)' } : {}}
            >
              {v >= 3600 ? `${v / 3600}h` : `${v / 60}m`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

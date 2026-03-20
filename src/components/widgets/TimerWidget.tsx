import { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function TimerWidget() {
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const reset = useCallback(() => { if (ref.current) clearInterval(ref.current); setRunning(false); setSeconds(300); }, []);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const progress = ((300 - seconds) / 300) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <span className="t-label">Timer</span>
      <div className="progress-track w-full max-w-[180px]">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <span className="t-display text-3xl">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
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
      {!running && !seconds && (
        <div className="flex gap-1.5">
          {[60, 180, 300, 600].map(v => (
            <button key={v} onClick={(e) => { e.stopPropagation(); setSeconds(v); }} className="btn-native text-xs py-1.5 px-3">
              {v / 60}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

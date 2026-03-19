import { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function TimerWidget() {
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (seconds <= 0) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(300);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <span className="t-label">Timer</span>
      <span className="t-display text-3xl">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
      <div className="flex gap-2">
        {!running ? (
          <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-pill flex items-center gap-1.5">
            <Play className="w-4 h-4" /> Start
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); pause(); }} className="btn-pill flex items-center gap-1.5">
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); reset(); }} className="btn-pill flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>
      {!running && !seconds && (
        <div className="flex gap-2">
          {[60, 180, 300, 600].map(s => (
            <button key={s} onClick={(e) => { e.stopPropagation(); setSeconds(s); }} className="btn-pill text-xs">
              {s / 60}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

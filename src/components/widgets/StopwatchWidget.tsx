import { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function StopwatchWidget() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    setElapsed(Date.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    startRef.current = Date.now() - elapsed;
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [elapsed, tick]);

  const pause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);
    setElapsed(0);
  }, []);

  const totalSecs = Math.floor(elapsed / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const ms = Math.floor((elapsed % 1000) / 10);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <span className="t-label">Stopwatch</span>
      <div className="flex items-baseline">
        <span className="t-display text-3xl">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
        <span className="text-lg text-muted-foreground ml-1">.{String(ms).padStart(2, '0')}</span>
      </div>
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
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function StopwatchWidget() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const raf = useRef<number | null>(null);

  const tick = useCallback(() => {
    setElapsed(Date.now() - startRef.current);
    raf.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    startRef.current = Date.now() - elapsed;
    setRunning(true);
    raf.current = requestAnimationFrame(tick);
  }, [elapsed, tick]);

  const pause = useCallback(() => { if (raf.current) cancelAnimationFrame(raf.current); setRunning(false); }, []);
  const reset = useCallback(() => { if (raf.current) cancelAnimationFrame(raf.current); setRunning(false); setElapsed(0); }, []);

  const total = Math.floor(elapsed / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const ms = Math.floor((elapsed % 1000) / 10);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <span className="t-label">Stopwatch</span>
      <div className="flex items-baseline">
        <span className="t-display text-3xl">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
        <span className="text-base text-muted-foreground ml-0.5 font-mono">.{String(ms).padStart(2, '0')}</span>
      </div>
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
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Flame } from 'lucide-react';

type Phase = 'work' | 'break';
const WORK = 25 * 60;
const BREAK = 5 * 60;

export default function PomodoroWidget() {
  const [phase, setPhase] = useState<Phase>('work');
  const [seconds, setSeconds] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = phase === 'work' ? 880 : 660;
      gain.gain.value = 0.08;
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [phase]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const switchPhase = useCallback((next: Phase) => {
    setPhase(next);
    setSeconds(next === 'work' ? WORK : BREAK);
    if (next === 'break') { setSessions(p => p + 1); notify('Break time!', 'Take a 5-minute break.'); }
    else notify('Focus!', 'Break is over.');
  }, [notify]);

  const start = useCallback(() => {
    if (seconds <= 0) return;
    setRunning(true);
    ref.current = setInterval(() => {
      setSeconds(p => {
        if (p <= 1) {
          clearInterval(ref.current!); setRunning(false);
          setTimeout(() => switchPhase(phase === 'work' ? 'break' : 'work'), 100);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }, [seconds, phase, switchPhase]);

  const pause = useCallback(() => { if (ref.current) clearInterval(ref.current); setRunning(false); }, []);
  const reset = useCallback(() => { if (ref.current) clearInterval(ref.current); setRunning(false); setPhase('work'); setSeconds(WORK); setSessions(0); }, []);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const total = phase === 'work' ? WORK : BREAK;
  const progress = ((total - seconds) / total) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4">
      <div className="flex items-center gap-2">
        {phase === 'work' ? <Flame className="w-4 h-4 text-accent" /> : <Coffee className="w-4 h-4 text-accent" />}
        <span className="t-label">{phase === 'work' ? 'Focus' : 'Break'}</span>
        {sessions > 0 && <span className="text-[0.6rem] text-muted-foreground">· {sessions}</span>}
      </div>

      <div className="progress-track w-full max-w-[180px]">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <span className="t-display text-3xl">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>

      <div className="flex items-center gap-2">
        {!running ? (
          <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-icon accent w-10 h-10">
            <Play className="w-5 h-5 ml-0.5" />
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); pause(); }} className="btn-icon accent w-10 h-10">
            <Pause className="w-5 h-5" />
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); reset(); }} className="btn-icon w-9 h-9">
          <RotateCcw className="w-4 h-4" />
        </button>
        {!running && (
          <button onClick={(e) => { e.stopPropagation(); switchPhase(phase === 'work' ? 'break' : 'work'); }} className="btn-icon w-9 h-9">
            {phase === 'work' ? <Coffee className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

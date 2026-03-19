import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Flame } from 'lucide-react';

type Phase = 'work' | 'break';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export default function PomodoroWidget() {
  const [phase, setPhase] = useState<Phase>('work');
  const [seconds, setSeconds] = useState(WORK_DURATION);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = phase === 'work' ? 880 : 660;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* silent fallback */ }
  }, [phase]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const switchPhase = useCallback((nextPhase: Phase) => {
    setPhase(nextPhase);
    setSeconds(nextPhase === 'work' ? WORK_DURATION : BREAK_DURATION);
    if (nextPhase === 'break') {
      setSessions(prev => prev + 1);
      notify('Break time!', 'Great work. Take a 5-minute break.');
    } else {
      notify('Back to work!', 'Break is over. Stay focused!');
    }
  }, [notify]);

  const start = useCallback(() => {
    if (seconds <= 0) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          const next = phase === 'work' ? 'break' : 'work';
          setTimeout(() => switchPhase(next), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds, phase, switchPhase]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setPhase('work');
    setSeconds(WORK_DURATION);
    setSessions(0);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const totalDuration = phase === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = ((totalDuration - seconds) / totalDuration) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4">
      <div className="flex items-center gap-2">
        {phase === 'work' ? <Flame className="w-4 h-4 text-accent" /> : <Coffee className="w-4 h-4 text-accent" />}
        <span className="t-label">Pomodoro — {phase === 'work' ? 'Focus' : 'Break'}</span>
      </div>
      {sessions > 0 && (
        <div className="text-center">
          <span className="text-xs text-muted-foreground">{sessions} session{sessions > 1 ? 's' : ''}</span>
        </div>
      )}
      <div className="progress-track w-full">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
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
      {!running && (
        <button
          onClick={(e) => { e.stopPropagation(); switchPhase(phase === 'work' ? 'break' : 'work'); }}
          className="btn-pill flex items-center gap-1.5"
        >
          {phase === 'work' ? <Coffee className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
          {phase === 'work' ? 'Break' : 'Work'}
        </button>
      )}
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Flame, Settings, Check } from 'lucide-react';

type Phase = 'work' | 'break' | 'long';

interface PomodoroSettings {
  work: number;       // seconds
  break: number;
  long: number;
  longEvery: number;  // sessions
}

const STORAGE_KEY = 'monolith_pomodoro_settings';
const DEFAULTS: PomodoroSettings = { work: 25 * 60, break: 5 * 60, long: 15 * 60, longEvery: 4 };

function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

function fmt(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PomodoroWidget() {
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);
  const [phase, setPhase] = useState<Phase>('work');
  const [seconds, setSeconds] = useState(settings.work);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(phase);
  const sessionsRef = useRef(sessions);
  phaseRef.current = phase;
  sessionsRef.current = sessions;

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }, [settings]);

  const notify = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = phaseRef.current === 'work' ? 880 : 660;
      gain.gain.value = 0.08;
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const switchPhase = useCallback((next: Phase) => {
    setPhase(next);
    setSeconds(next === 'work' ? settings.work : next === 'break' ? settings.break : settings.long);
    if (next === 'work') notify('Focus!', 'Break is over.');
    else notify(next === 'long' ? 'Long break!' : 'Break time!', 'Step away for a moment.');
  }, [settings, notify]);

  const start = useCallback(() => {
    if (seconds <= 0) return;
    setRunning(true);
    ref.current = setInterval(() => {
      setSeconds(p => {
        if (p <= 1) {
          clearInterval(ref.current!); setRunning(false);
          setTimeout(() => {
            if (phaseRef.current === 'work') {
              const ns = sessionsRef.current + 1;
              setSessions(ns);
              switchPhase(ns % settings.longEvery === 0 ? 'long' : 'break');
            } else {
              switchPhase('work');
            }
          }, 100);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }, [seconds, switchPhase, settings.longEvery]);

  const pause = useCallback(() => { if (ref.current) clearInterval(ref.current); setRunning(false); }, []);
  const reset = useCallback(() => {
    if (ref.current) clearInterval(ref.current);
    setRunning(false); setPhase('work'); setSeconds(settings.work); setSessions(0);
  }, [settings.work]);

  const total = phase === 'work' ? settings.work : phase === 'break' ? settings.break : settings.long;
  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0;
  const Icon = phase === 'work' ? Flame : Coffee;
  const label = phase === 'work' ? 'Focus' : phase === 'long' ? 'Long Break' : 'Break';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4 relative">
      <div className="flex items-center gap-2 w-full justify-center">
        <Icon className="w-4 h-4 text-accent" />
        <span className="t-label">{label}</span>
        {sessions > 0 && <span className="text-[0.65rem] text-muted-foreground">· {sessions}</span>}
        <button
          onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
          className="btn-icon w-6 h-6 ml-1 opacity-50 hover:opacity-100"
          title="Settings"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>

      <div className="progress-track w-full max-w-[200px]">
        <div className="progress-fill transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <span className="t-display text-2xl tabular-nums tracking-tight">{fmt(seconds)}</span>

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
          <button
            onClick={(e) => { e.stopPropagation(); switchPhase(phase === 'work' ? 'break' : 'work'); }}
            className="btn-icon w-9 h-9"
          >
            {phase === 'work' ? <Coffee className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
          </button>
        )}
      </div>

      {showSettings && (
        <div
          className="absolute inset-0 z-10 flex flex-col gap-3 p-4 animate-fade-in"
          style={{ background: 'hsl(var(--surface) / 0.96)', backdropFilter: 'blur(14px)', borderRadius: 'inherit' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="t-label">Pomodoro Settings</span>
          {([
            ['work', 'Focus (min)', 60],
            ['break', 'Break (min)', 60],
            ['long', 'Long break (min)', 60],
            ['longEvery', 'Long break every', 1],
          ] as const).map(([key, lbl, mult]) => (
            <label key={key} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{lbl}</span>
              <input
                type="number"
                min={1}
                value={mult === 60 ? Math.round((settings[key] as number) / 60) : settings[key]}
                onChange={(e) => {
                  const v = Math.max(1, parseInt(e.target.value || '1', 10));
                  setSettings(s => ({ ...s, [key]: mult === 60 ? v * 60 : v }));
                }}
                className="input-native w-20 py-1 text-sm text-center"
              />
            </label>
          ))}
          <button
            onClick={() => { setShowSettings(false); reset(); }}
            className="btn-native accent text-xs py-2 mt-auto flex items-center justify-center gap-2"
          >
            <Check className="w-3.5 h-3.5" /> Done
          </button>
        </div>
      )}
    </div>
  );
}

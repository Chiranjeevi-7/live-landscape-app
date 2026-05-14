import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Smart light controller hook.
 *
 * Architecture:
 *  - State is persisted locally so the dashboard restores instantly on refresh.
 *  - `dispatch()` is the single integration point. Today it just logs and
 *    optimistically updates state. Swap the body for one of:
 *      a) Direct Magic Home LAN control via a tiny edge function /
 *         Capacitor TCP plugin (port 5577, raw protocol).
 *      b) Google Home / Smart Home Actions via OAuth + a relay endpoint.
 *    The UI never needs to change.
 */

export type LightMode = 'color' | 'white';
export type ScenePreset = 'focus' | 'chill' | 'night' | 'movie' | 'music';

export interface LightState {
  on: boolean;
  brightness: number;   // 0-100
  color: string;        // hex, used when mode === 'color'
  warmth: number;       // 0 (cool) - 100 (warm), used when mode === 'white'
  mode: LightMode;
  scene?: ScenePreset;
}

const STORAGE_KEY = 'monolith_lights_state';

const DEFAULT_STATE: LightState = {
  on: false,
  brightness: 80,
  color: '#ffb070',
  warmth: 60,
  mode: 'color',
};

export const SCENE_PRESETS: Record<ScenePreset, Partial<LightState>> = {
  focus:  { on: true, mode: 'white', warmth: 20, brightness: 100 },
  chill:  { on: true, mode: 'color', color: '#ff7a3d', brightness: 55 },
  night:  { on: true, mode: 'color', color: '#ff3b6b', brightness: 18 },
  movie:  { on: true, mode: 'color', color: '#5a3bff', brightness: 30 },
  music:  { on: true, mode: 'color', color: '#3bd9ff', brightness: 75 },
};

function load(): LightState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STATE;
}

export function useLights() {
  const [state, setState] = useState<LightState>(load);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist (debounced for slider drags so we don't thrash localStorage on old phones)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [state]);

  // Single point of integration with the real bulb backend.
  const dispatch = useCallback((next: LightState) => {
    // TODO: call Magic Home LAN bridge or Google Home relay here.
    // Keep it fire-and-forget so the UI stays smooth.
    // console.debug('[lights] dispatch', next);
  }, []);

  const update = useCallback((patch: Partial<LightState>) => {
    setState(prev => {
      const next = { ...prev, ...patch, scene: patch.scene ?? (patch.color || patch.warmth !== undefined ? undefined : prev.scene) };
      dispatch(next);
      return next;
    });
  }, [dispatch]);

  const togglePower    = useCallback(() => update({ on: !state.on }), [state.on, update]);
  const setBrightness  = useCallback((v: number) => update({ brightness: v, on: true }), [update]);
  const setColor       = useCallback((c: string) => update({ color: c, mode: 'color', on: true }), [update]);
  const setWarmth      = useCallback((v: number) => update({ warmth: v, mode: 'white', on: true }), [update]);
  const setMode        = useCallback((m: LightMode) => update({ mode: m }), [update]);
  const applyScene     = useCallback((s: ScenePreset) => update({ ...SCENE_PRESETS[s], scene: s }), [update]);

  return { state, togglePower, setBrightness, setColor, setWarmth, setMode, applyScene };
}
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export type LightBackend = 'none' | 'magic_home' | 'webhook' | 'home_assistant' | 'google';

export interface LightSettings {
  backend: LightBackend;
  magic_home?: { ip?: string; port?: number; bridgeUrl?: string };
  webhook?: { url?: string; token?: string };
  home_assistant?: { baseUrl?: string; token?: string; entityId?: string };
  google?: { relayUrl?: string; token?: string; deviceName?: string };
}

export interface LightState {
  on: boolean;
  brightness: number;   // 0-100
  color: string;        // hex, used when mode === 'color'
  warmth: number;       // 0 (cool) - 100 (warm), used when mode === 'white'
  mode: LightMode;
  scene?: ScenePreset;
}

const STORAGE_KEY = 'monolith_lights_state';
const SETTINGS_KEY = 'monolith_lights_settings';

const DEFAULT_STATE: LightState = {
  on: false,
  brightness: 80,
  color: '#ffb070',
  warmth: 60,
  mode: 'color',
};

const DEFAULT_SETTINGS: LightSettings = {
  backend: 'magic_home',
  magic_home: { ip: '192.168.68.110', port: 8080 },
};

function hexToHslString(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hh = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: hh = ((b - r) / d + 2); break;
      case b: hh = ((r - g) / d + 4); break;
    }
    hh *= 60;
  }
  return `${Math.round(hh)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyAmbient(state: LightState, color: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!state.on) {
    root.style.removeProperty('--ambient-glow');
    root.style.setProperty('--ambient-intensity', '0');
    return;
  }
  root.style.setProperty('--ambient-glow', hexToHslString(color));
  root.style.setProperty('--ambient-intensity', String(Math.max(0.15, state.brightness / 100)));
}

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

function loadSettings(): LightSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useLights() {
  const [state, setState] = useState<LightState>(load);
  const [settings, setSettingsState] = useState<LightSettings>(loadSettings);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Persist (debounced for slider drags so we don't thrash localStorage on old phones)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [state]);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  // Ambient dashboard sync — drive a CSS variable so the rest of the UI can
  // pick up the current light colour without subscribing to the hook.
  useEffect(() => {
    const tintColor = state.mode === 'white'
      ? `#${
          [
            Math.round(0xcf + ((0xff - 0xcf) * state.warmth) / 100),
            Math.round(0xe6 + ((0xb0 - 0xe6) * state.warmth) / 100),
            Math.round(0xff + ((0x70 - 0xff) * state.warmth) / 100),
          ].map(n => n.toString(16).padStart(2, '0')).join('')
        }`
      : state.color;
    applyAmbient(state, tintColor);
  }, [state]);

  // Direct LAN reach — when the dashboard is on the same WiFi as the device
  // we can hit a local HTTP bridge (flux_led_http / mqtt2magic / custom).
  // No CORS preflight on simple POSTs with text/plain; bridges typically
  // return 200 OK. Failures are silently swallowed.
  const dispatchLAN = useCallback((cfg: any, next: LightState) => {
    const url = cfg?.bridgeUrl || (cfg?.ip ? `http://${cfg.ip}:${cfg.port || 8080}/set` : '');
    if (!url) return;
    try {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          on: next.on,
          brightness: next.brightness,
          color: next.color,
          warmth: next.warmth,
          mode: next.mode,
          scene: next.scene,
        }),
      }).catch(() => {});
    } catch {}
  }, []);

  // Single point of integration. Debounced + fire-and-forget so slider drags
  // stay buttery on old Android WebViews. Routes through the lights-control
  // edge function which knows how to speak to each backend.
  const dispatch = useCallback((next: LightState) => {
    const s = settingsRef.current;
    if (!s || s.backend === 'none') return;
    if (dispatchRef.current) clearTimeout(dispatchRef.current);
    dispatchRef.current = setTimeout(() => {
      const config =
        s.backend === 'magic_home' ? s.magic_home :
        s.backend === 'webhook' ? s.webhook :
        s.backend === 'home_assistant' ? s.home_assistant :
        s.backend === 'google' ? s.google : {};
      // Magic Home runs on the local LAN — try the device directly first.
      if (s.backend === 'magic_home') {
        dispatchLAN(config, next);
      }
      supabase.functions.invoke('lights-control', {
        body: {
          backend: s.backend,
          config: config || {},
          command: {
            on: next.on,
            brightness: next.brightness,
            color: next.color,
            warmth: next.warmth,
            mode: next.mode,
            scene: next.scene,
          },
        },
      }).catch(() => { /* offline-tolerant */ });
    }, 90);
  }, [dispatchLAN]);

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

  const setSettings = useCallback((patch: Partial<LightSettings>) => {
    setSettingsState(prev => ({ ...prev, ...patch }));
  }, []);

  return { state, settings, togglePower, setBrightness, setColor, setWarmth, setMode, applyScene, setSettings };
}
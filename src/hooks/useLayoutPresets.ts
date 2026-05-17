import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardLayout } from '@/types/dashboard';

export interface LayoutPreset {
  id: string;
  name: string;
  layout: DashboardLayout;
  createdAt: number;
}

const STORAGE_KEY = 'monolith_layout_presets';
const ACTIVE_KEY = 'monolith_active_preset';

interface Stored {
  presets: LayoutPreset[];
  activeId: string | null;
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const active = localStorage.getItem(ACTIVE_KEY);
    const presets = raw ? (JSON.parse(raw) as LayoutPreset[]) : [];
    return { presets, activeId: active || null };
  } catch {
    return { presets: [], activeId: null };
  }
}

function save(presets: LayoutPreset[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(presets)); } catch { /* noop */ }
}

function saveActive(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch { /* noop */ }
}

function genId() {
  return `preset-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function useLayoutPresets(
  currentLayout: DashboardLayout,
  applyLayout: (l: DashboardLayout) => void,
) {
  const [state, setState] = useState<Stored>(load);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { save(state.presets); }, [state.presets]);
  useEffect(() => { saveActive(state.activeId); }, [state.activeId]);

  const animate = useCallback(() => {
    document.body.classList.add('presets-animating');
    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => {
      document.body.classList.remove('presets-animating');
    }, 650);
  }, []);

  const apply = useCallback((id: string) => {
    const p = state.presets.find(x => x.id === id);
    if (!p) return;
    animate();
    applyLayout(p.layout);
    setState(s => ({ ...s, activeId: id }));
  }, [state.presets, applyLayout, animate]);

  const saveCurrentAs = useCallback((name: string): string => {
    const id = genId();
    const preset: LayoutPreset = {
      id, name: name.trim() || 'Untitled',
      layout: JSON.parse(JSON.stringify(currentLayout)),
      createdAt: Date.now(),
    };
    setState(s => ({ presets: [...s.presets, preset], activeId: id }));
    return id;
  }, [currentLayout]);

  const overwrite = useCallback((id: string) => {
    setState(s => ({
      ...s,
      presets: s.presets.map(p =>
        p.id === id ? { ...p, layout: JSON.parse(JSON.stringify(currentLayout)) } : p
      ),
      activeId: id,
    }));
  }, [currentLayout]);

  const rename = useCallback((id: string, name: string) => {
    setState(s => ({
      ...s,
      presets: s.presets.map(p => p.id === id ? { ...p, name: name.trim() || p.name } : p),
    }));
  }, []);

  const remove = useCallback((id: string) => {
    setState(s => ({
      presets: s.presets.filter(p => p.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    }));
  }, []);

  const duplicate = useCallback((id: string) => {
    setState(s => {
      const orig = s.presets.find(p => p.id === id);
      if (!orig) return s;
      const copy: LayoutPreset = {
        ...orig,
        id: genId(),
        name: `${orig.name} copy`,
        createdAt: Date.now(),
        layout: JSON.parse(JSON.stringify(orig.layout)),
      };
      return { ...s, presets: [...s.presets, copy] };
    });
  }, []);

  return {
    presets: state.presets,
    activeId: state.activeId,
    apply,
    saveCurrentAs,
    overwrite,
    rename,
    remove,
    duplicate,
  };
}

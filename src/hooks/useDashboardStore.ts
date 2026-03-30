import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, WidgetConfig, DEFAULT_LAYOUT, ACCENT_COLORS, THEMES } from '@/types/dashboard';

const STORAGE_KEY = 'monolith_settings';

interface MonolithSettings {
  layout: DashboardLayout;
  themeIndex: number;
  accentIndex: number;
  brightness: number;
}

function migrateLayout(raw: any): DashboardLayout {
  if (raw?.layout?.widgets && Array.isArray(raw.layout.widgets)) {
    return raw.layout;
  }
  if (raw?.layout?.slots) {
    const widgets: WidgetConfig[] = [];
    const slots = raw.layout.slots as { widgets: { id: string; type: string }[] }[];
    const slotWidth = 30;
    slots.forEach((slot, si) => {
      const x = 2 + si * 33;
      slot.widgets.forEach((w, wi) => {
        const h = Math.floor(90 / Math.max(slot.widgets.length, 1));
        widgets.push({
          id: w.id,
          type: w.type as WidgetConfig['type'],
          x,
          y: 5 + wi * h,
          w: slotWidth,
          h: Math.min(h, 90),
          shape: 'squircle',
        });
      });
    });
    return { widgets: widgets.length > 0 ? widgets : DEFAULT_LAYOUT.widgets };
  }
  return DEFAULT_LAYOUT;
}

function loadSettings(): MonolithSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        layout: migrateLayout(parsed),
        themeIndex: parsed.themeIndex ?? 0,
        accentIndex: parsed.accentIndex ?? 0,
      };
    }
  } catch { /* ignore */ }
  return { layout: DEFAULT_LAYOUT, themeIndex: 0, accentIndex: 0 };
}

function saveSettings(s: MonolithSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function useDashboardStore() {
  const [settings, setSettings] = useState<MonolithSettings>(loadSettings);

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach(t => { if (t.className) root.classList.remove(t.className); });
    const cls = THEMES[settings.themeIndex]?.className;
    if (cls) root.classList.add(cls);
  }, [settings.themeIndex]);

  useEffect(() => {
    const hex = ACCENT_COLORS[settings.accentIndex] || ACCENT_COLORS[0];
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    document.documentElement.style.setProperty('--primary', hsl);
    document.documentElement.style.setProperty('--accent', hsl);
    document.documentElement.style.setProperty('--ring', hsl);
  }, [settings.accentIndex]);

  useEffect(() => { saveSettings(settings); }, [settings]);

  const setLayout = useCallback((layout: DashboardLayout) => {
    setSettings(prev => ({ ...prev, layout }));
  }, []);

  const updateWidget = useCallback((id: string, updates: Partial<WidgetConfig>) => {
    setSettings(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        widgets: prev.layout.widgets.map(w => w.id === id ? { ...w, ...updates } : w),
      },
    }));
  }, []);

  const addWidget = useCallback((widget: WidgetConfig) => {
    setSettings(prev => ({
      ...prev,
      layout: { ...prev.layout, widgets: [...prev.layout.widgets, widget] },
    }));
  }, []);

  const removeWidget = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      layout: { ...prev.layout, widgets: prev.layout.widgets.filter(w => w.id !== id) },
    }));
  }, []);

  const cycleTheme = useCallback(() => {
    setSettings(prev => ({ ...prev, themeIndex: (prev.themeIndex + 1) % THEMES.length }));
  }, []);

  const cycleAccent = useCallback(() => {
    setSettings(prev => ({ ...prev, accentIndex: (prev.accentIndex + 1) % ACCENT_COLORS.length }));
  }, []);

  return {
    layout: settings.layout,
    themeIndex: settings.themeIndex,
    accentIndex: settings.accentIndex,
    setLayout,
    updateWidget,
    addWidget,
    removeWidget,
    cycleTheme,
    cycleAccent,
  };
}

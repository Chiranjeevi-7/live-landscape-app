import { useState, useCallback, useRef } from 'react';
import ClockFaceRenderer from '@/components/clock-faces/ClockFaceRenderer';
import ClockSettingsPanel from '@/components/clock-faces/ClockSettingsPanel';
import { DEFAULT_CLOCK_SETTINGS, CLOCK_STYLE_LABELS, GRADIENT_PRESETS } from '@/types/clock';
import type { ClockSettings, ClockStyle } from '@/types/clock';

const STORAGE_KEY = 'monolith_clock_settings';
const ALL_STYLES = Object.keys(CLOCK_STYLE_LABELS) as ClockStyle[];

function loadClockSettings(): ClockSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CLOCK_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_CLOCK_SETTINGS;
}

export default function ClockWidget() {
  const [settings, setSettings] = useState<ClockSettings>(loadClockSettings);
  const [showSettings, setShowSettings] = useState(false);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((partial: Partial<ClockSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const cycleStyle = useCallback(() => {
    setSettings(prev => {
      const idx = ALL_STYLES.indexOf(prev.style);
      const next = { ...prev, style: ALL_STYLES[(idx + 1) % ALL_STYLES.length] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const bgStyle: React.CSSProperties = {};
  if (settings.bgType === 'gradient') {
    const preset = GRADIENT_PRESETS[settings.bgGradient];
    if (preset) bgStyle.background = preset.css;
  } else if (settings.bgType === 'image' && settings.bgImage) {
    bgStyle.backgroundImage = `url(${settings.bgImage})`;
    bgStyle.backgroundSize = 'cover';
    bgStyle.backgroundPosition = 'center';
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className="w-full h-full flex items-center justify-center cursor-pointer"
        onClick={(e) => { e.stopPropagation(); cycleStyle(); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setShowSettings(true); }}
        onTouchStart={() => { longPress.current = setTimeout(() => setShowSettings(true), 600); }}
        onTouchEnd={() => { if (longPress.current) clearTimeout(longPress.current); }}
        onTouchMove={() => { if (longPress.current) clearTimeout(longPress.current); }}
      >
        {settings.bgType !== 'none' && (
          <div className="absolute inset-0" style={{ ...bgStyle, opacity: settings.bgOpacity, borderRadius: 'inherit' }} />
        )}
        <ClockFaceRenderer settings={settings} />
      </div>
      {showSettings && (
        <ClockSettingsPanel settings={settings} onChange={update} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

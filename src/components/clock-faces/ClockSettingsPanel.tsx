import { useRef, useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { ClockSettings, ClockStyle, ClockFont, ClockBgType, ClockGradient } from '@/types/clock';
import { CLOCK_STYLE_LABELS, CLOCK_FONT_LABELS, GRADIENT_PRESETS } from '@/types/clock';

const ALL_STYLES = Object.keys(CLOCK_STYLE_LABELS) as ClockStyle[];
const ALL_FONTS = Object.keys(CLOCK_FONT_LABELS) as ClockFont[];
const ALL_GRADIENTS = Object.keys(GRADIENT_PRESETS) as ClockGradient[];

interface Props {
  settings: ClockSettings;
  onChange: (partial: Partial<ClockSettings>) => void;
  onClose: () => void;
}

export default function ClockSettingsPanel({ settings, onChange, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [parentRect, setParentRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (panelRef.current) {
      const widgetEl = panelRef.current.closest('.widget-panel');
      if (widgetEl) {
        setParentRect(widgetEl.getBoundingClientRect());
      }
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ bgType: 'image', bgImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const activeBtn = (active: boolean): React.CSSProperties =>
    active ? { background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))', borderColor: 'hsl(var(--accent))' } : {};

  const toggleBtn = (active: boolean): React.CSSProperties =>
    active ? { background: 'hsl(var(--accent) / 0.2)', borderColor: 'hsl(var(--accent) / 0.4)' } : {};

  const panelStyle: React.CSSProperties = {};
  if (parentRect) {
    const pw = parentRect.width;
    const ph = parentRect.height;
    panelStyle.maxWidth = `${Math.min(480, Math.max(280, pw - 32))}px`;
    panelStyle.maxHeight = `${Math.max(300, ph - 32)}px`;
  }

  return (
    <div ref={panelRef} className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'hsl(0 0% 0% / 0.6)' }}>
      <div className="absolute inset-0" onClick={(e) => { e.stopPropagation(); onClose(); }}>
        <X className="absolute top-3 right-3 w-5 h-5 cursor-pointer text-foreground/60 hover:text-foreground" />
      </div>
      <div className="relative rounded-2xl p-5 overflow-y-auto space-y-4" style={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', ...panelStyle }} onClick={(e) => e.stopPropagation()}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <h3 className="text-sm font-semibold text-foreground">Clock Settings</h3>

        {/* Style selector */}
        <div className="space-y-2">
          <span className="t-label">Style</span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STYLES.map(s => (
              <button key={s} onClick={() => onChange({ style: s })} className="btn-pill text-xs py-1 px-2.5" style={activeBtn(settings.style === s)}>
                {CLOCK_STYLE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Font selector */}
        <div className="space-y-2">
          <span className="t-label">Font</span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_FONTS.map(f => (
              <button key={f} onClick={() => onChange({ font: f })} className="btn-pill text-xs py-1 px-2.5" style={activeBtn(settings.font === f)}>
                {CLOCK_FONT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className="space-y-2">
          <span className="t-label">Size</span>
          <input type="range" min="0.5" max="2" step="0.1" value={settings.fontSize} onChange={(e) => onChange({ fontSize: parseFloat(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
        </div>

        {/* Background */}
        <div className="space-y-2">
          <span className="t-label">Background</span>
          <div className="flex flex-wrap gap-1.5">
            {(['none', 'gradient', 'image'] as ClockBgType[]).map(t => (
              <button key={t} onClick={() => onChange({ bgType: t })} className="btn-pill text-xs py-1 px-2.5 capitalize" style={activeBtn(settings.bgType === t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Gradient presets */}
        {settings.bgType === 'gradient' && (
          <div className="flex flex-wrap gap-1.5">
            {ALL_GRADIENTS.map(g => (
              <button key={g} onClick={() => onChange({ bgGradient: g })} className="btn-pill text-xs py-1 px-2 flex items-center gap-1" style={activeBtn(settings.bgGradient === g)}>
                <span className="w-3 h-3 rounded-full" style={{ background: GRADIENT_PRESETS[g].css }} />
                {GRADIENT_PRESETS[g].label}
              </button>
            ))}
          </div>
        )}

        {/* Image upload */}
        {settings.bgType === 'image' && (
          <div className="space-y-2">
            <button onClick={() => fileRef.current?.click()} className="btn-pill text-xs py-2 px-4 flex items-center gap-1.5 w-full justify-center">
              <Upload className="w-3.5 h-3.5" /> Upload Image / GIF
            </button>
            {settings.bgImage && (
              <div className="relative w-full h-16 rounded-lg overflow-hidden">
                <img src={settings.bgImage} alt="bg preview" className="w-full h-full object-cover" />
                <button onClick={() => onChange({ bgImage: '', bgType: 'none' })} className="absolute top-1 right-1 p-0.5 rounded-full" style={{ background: 'hsl(var(--destructive) / 0.8)' }}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Opacity slider */}
        {settings.bgType !== 'none' && (
          <div className="space-y-2">
            <span className="t-label">Opacity</span>
            <input type="range" min="0.1" max="1" step="0.05" value={settings.bgOpacity} onChange={(e) => onChange({ bgOpacity: parseFloat(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
        )}

        {/* Toggles */}
        <div className="flex flex-wrap gap-1.5">
          {([
            ['showSeconds', 'Seconds'],
            ['showDate', 'Date'],
            ['showAmPm', 'AM/PM'],
            ['hour12', '12-Hour'],
            ['glowEffect', 'Glow'],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => onChange({ [key]: !settings[key] })} className="btn-pill text-xs py-1.5 flex items-center justify-center gap-1" style={toggleBtn(settings[key] as boolean)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

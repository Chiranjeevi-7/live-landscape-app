import { useEffect, useRef, useState, useCallback } from 'react';
import { Power, Sun, Palette, Thermometer } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useLights, SCENE_PRESETS, type ScenePreset, type LightMode } from '@/hooks/useLights';

const SCENES: { key: ScenePreset; label: string; tint: string }[] = [
  { key: 'focus',  label: 'Focus',  tint: '#cfe6ff' },
  { key: 'chill',  label: 'Chill',  tint: '#ff7a3d' },
  { key: 'night',  label: 'Night',  tint: '#ff3b6b' },
  { key: 'movie',  label: 'Movie',  tint: '#5a3bff' },
  { key: 'music',  label: 'Music',  tint: '#3bd9ff' },
];

const SWATCHES = [
  '#ffffff', '#ffb070', '#ff5a3d', '#ff3b6b',
  '#c43bff', '#5a3bff', '#3b8aff', '#3bd9ff',
  '#3bff9a', '#d9ff3b',
];

function effectiveColor(color: string, warmth: number, mode: LightMode): string {
  if (mode === 'color') return color;
  // warm 100 → #ffb070, cool 0 → #cfe6ff
  const t = warmth / 100;
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const r = lerp(0xcf, 0xff);
  const g = lerp(0xe6, 0xb0);
  const b = lerp(0xff, 0x70);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function LightsWidget() {
  const { state, togglePower, setBrightness, setColor, setWarmth, setMode, applyScene } = useLights();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const e = entries[0];
      const w = e.contentRect.width;
      const h = e.contentRect.height;
      setCompact(w < 260 || h < 220);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const glow = effectiveColor(state.color, state.warmth, state.mode);
  const glowAlpha = state.on ? Math.max(0.15, state.brightness / 100) : 0.05;

  const onPickColor = useCallback((c: string) => setColor(c), [setColor]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full flex flex-col gap-2 p-3 overflow-hidden transition-all duration-300"
      style={{
        background: 'hsl(var(--surface))',
        borderRadius: 18,
        boxShadow: state.on
          ? `inset 0 0 0 1px hsl(var(--border)), 0 0 28px -4px ${glow}${Math.round(glowAlpha * 255).toString(16).padStart(2, '0')}`
          : 'inset 0 0 0 1px hsl(var(--border))',
      }}
    >
      {/* Ambient glow halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${glow}, transparent 65%)`,
          opacity: state.on ? glowAlpha * 0.35 : 0,
        }}
      />

      {/* Header: indicator + power */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-3 h-3 rounded-full transition-all duration-300"
            style={{
              background: state.on ? glow : 'hsl(var(--muted))',
              boxShadow: state.on ? `0 0 10px ${glow}` : 'none',
            }}
          />
          <span className="text-xs font-medium text-foreground/80 truncate">
            {state.on ? (state.scene ? state.scene.charAt(0).toUpperCase() + state.scene.slice(1) : 'On') : 'Off'}
          </span>
        </div>
        <button
          onClick={togglePower}
          className="rounded-full p-2 transition-all active:scale-90"
          style={{
            background: state.on ? glow : 'hsl(var(--surface-bright))',
            color: state.on ? '#0a0a0a' : 'hsl(var(--foreground))',
          }}
          title={state.on ? 'Turn off' : 'Turn on'}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Brightness — always visible */}
      <div className="relative flex items-center gap-2">
        <Sun className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Slider
          value={[state.brightness]}
          min={1}
          max={100}
          step={1}
          onValueChange={(v) => setBrightness(v[0])}
          className="flex-1"
        />
        <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right">{state.brightness}%</span>
      </div>

      {!compact && (
        <>
          {/* Mode toggle */}
          <div className="relative flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'hsl(var(--surface-bright))' }}>
            <button
              onClick={() => setMode('color')}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] transition-all"
              style={{
                background: state.mode === 'color' ? 'hsl(var(--surface))' : 'transparent',
                color: state.mode === 'color' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              <Palette className="w-3 h-3" /> Color
            </button>
            <button
              onClick={() => setMode('white')}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] transition-all"
              style={{
                background: state.mode === 'white' ? 'hsl(var(--surface))' : 'transparent',
                color: state.mode === 'white' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              <Thermometer className="w-3 h-3" /> White
            </button>
          </div>

          {state.mode === 'color' ? (
            <div className="relative flex flex-wrap gap-1.5">
              {SWATCHES.map(c => (
                <button
                  key={c}
                  onClick={() => onPickColor(c)}
                  className="w-6 h-6 rounded-full transition-transform active:scale-90"
                  style={{
                    background: c,
                    boxShadow: state.color.toLowerCase() === c.toLowerCase()
                      ? `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${c}`
                      : 'inset 0 0 0 1px hsl(var(--border))',
                  }}
                  aria-label={`Set color ${c}`}
                />
              ))}
              <label
                className="w-6 h-6 rounded-full overflow-hidden cursor-pointer flex items-center justify-center text-[10px] text-muted-foreground"
                style={{ background: 'hsl(var(--surface-bright))', border: '1px dashed hsl(var(--border))' }}
                title="Custom color"
              >
                +
                <input
                  type="color"
                  value={state.color}
                  onChange={(e) => onPickColor(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
              </label>
            </div>
          ) : (
            <div className="relative flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Cool</span>
              <Slider
                value={[state.warmth]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setWarmth(v[0])}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground">Warm</span>
            </div>
          )}

          {/* Scene presets */}
          <div className="relative grid grid-cols-5 gap-1 mt-auto">
            {SCENES.map(s => {
              const active = state.scene === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => applyScene(s.key)}
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg text-[10px] transition-all active:scale-95"
                  style={{
                    background: active ? 'hsl(var(--surface-bright))' : 'transparent',
                    border: '1px solid',
                    borderColor: active ? s.tint : 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: s.tint, boxShadow: `0 0 6px ${s.tint}` }}
                  />
                  {s.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
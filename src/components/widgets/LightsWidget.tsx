import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import { Power, Settings, X } from 'lucide-react';
import { useLights, type ScenePreset, type LightBackend } from '@/hooks/useLights';

/* ───────────────────── presets ───────────────────── */

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

/* ───────────────────── colour utils ───────────────────── */

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
}
function hexToHsv(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let hh = 0;
  if (d !== 0) {
    switch (max) {
      case r: hh = ((g - b) / d) % 6; break;
      case g: hh = (b - r) / d + 2; break;
      case b: hh = (r - g) / d + 4; break;
    }
    hh = (hh * 60 + 360) % 360;
  }
  return { h: hh, s: max === 0 ? 0 : d / max, v: max };
}

/* ───────────────────── color wheel ───────────────────── */

const ColorWheel = memo(function ColorWheel({
  size, color, on, brightness, onChange,
}: {
  size: number;
  color: string;
  on: boolean;
  brightness: number;
  onChange: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Draw wheel once per size (cheap on old phones)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = size * dpr;
    cv.height = size * dpr;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const r = size / 2;
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - r, dy = y - r;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;
        if (dist > r) { data[idx + 3] = 0; continue; }
        let ang = Math.atan2(dy, dx) * 180 / Math.PI; if (ang < 0) ang += 360;
        const sat = Math.min(1, dist / r);
        const { r: cr, g: cg, b: cb } = hsvToRgb(ang, sat, 1);
        data[idx] = cr; data[idx + 1] = cg; data[idx + 2] = cb;
        data[idx + 3] = 255;
        // anti-alias edge
        if (dist > r - 1) data[idx + 3] = Math.round((r - dist) * 255);
      }
    }
    // Render image data scaled
    const off = document.createElement('canvas');
    off.width = size; off.height = size;
    off.getContext('2d')!.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(off, 0, 0, size, size);
  }, [size]);

  const { h, s } = hexToHsv(color);
  const r = size / 2;
  const selRadius = s * r * 0.92;
  const selX = r + Math.cos(h * Math.PI / 180) * selRadius;
  const selY = r + Math.sin(h * Math.PI / 180) * selRadius;

  const sample = useCallback((clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = clientX - rect.left - r;
    const y = clientY - rect.top - r;
    const dist = Math.sqrt(x * x + y * y);
    let ang = Math.atan2(y, x) * 180 / Math.PI; if (ang < 0) ang += 360;
    const sat = Math.min(1, dist / r);
    const { r: cr, g: cg, b: cb } = hsvToRgb(ang, sat, 1);
    onChange(rgbToHex(cr, cg, cb));
  }, [r, onChange]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    sample(e.clientX, e.clientY);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    sample(e.clientX, e.clientY);
  };
  const onUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
  };

  const glowAlpha = on ? Math.max(0.25, brightness / 100) : 0.05;

  return (
    <div
      ref={wrapRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="relative touch-none select-none"
      style={{
        width: size, height: size,
        borderRadius: '50%',
        boxShadow: `0 0 32px -4px ${color}${Math.round(glowAlpha * 255).toString(16).padStart(2, '0')}`,
        transition: 'box-shadow 300ms var(--easing)',
        opacity: on ? 1 : 0.55,
      }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size, borderRadius: '50%', display: 'block' }} />
      {/* selector ring */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 18, height: 18,
          left: selX - 9, top: selY - 9,
          background: color,
          border: '2px solid rgba(255,255,255,0.95)',
          boxShadow: `0 0 0 1px rgba(0,0,0,0.3), 0 0 12px ${color}`,
          transition: draggingRef.current ? 'none' : 'left 120ms var(--easing), top 120ms var(--easing)',
        }}
      />
    </div>
  );
});

/* ───────────────────── brightness slider (pointer events) ───────────────────── */

function BrightnessSlider({
  value, color, on, onChange,
}: {
  value: number;
  color: string;
  on: boolean;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);

  const sample = useCallback((clientX: number) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(1, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
    onChange(pct);
  }, [onChange]);

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = true;
    sample(e.clientX);
  };
  const onMove = (e: React.PointerEvent) => { if (dragRef.current) sample(e.clientX); };
  const onUp = (e: React.PointerEvent) => {
    dragRef.current = false;
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
  };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="relative w-full touch-none select-none"
      style={{ height: 28, padding: '12px 0', cursor: 'pointer' }}
    >
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full overflow-hidden"
        style={{ height: 4, background: 'hsl(var(--surface-bright))' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: on ? `linear-gradient(90deg, ${color}55, ${color})` : 'hsl(var(--muted))',
            transition: dragRef.current ? 'none' : 'width 120ms var(--easing)',
          }}
        />
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
        style={{
          left: `${value}%`,
          width: 16, height: 16,
          background: 'hsl(var(--foreground))',
          boxShadow: on ? `0 0 10px ${color}` : '0 1px 4px rgba(0,0,0,0.4)',
          transition: dragRef.current ? 'none' : 'left 120ms var(--easing)',
        }}
      />
    </div>
  );
}

/* ───────────────────── widget ───────────────────── */

export default function LightsWidget() {
  const {
    state, settings,
    togglePower, setBrightness, setColor, applyScene, setSettings,
  } = useLights();

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 320, h: 320 });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(entries => {
      const e = entries[0];
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = size.w < 240 || size.h < 260;
  const wheelSize = useMemo(() => {
    const avail = Math.min(size.w - 24, size.h - (compact ? 90 : 160));
    return Math.max(80, Math.min(220, avail));
  }, [size, compact]);

  const glow = state.color;

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full flex flex-col items-center gap-2 p-3 overflow-hidden"
      style={{
        background: 'hsl(var(--surface))',
        borderRadius: 18,
        boxShadow: state.on
          ? `inset 0 0 0 1px hsl(var(--border)), 0 0 24px -6px ${glow}55`
          : 'inset 0 0 0 1px hsl(var(--border))',
        transition: 'box-shadow 400ms var(--easing)',
      }}
    >
      {/* header */}
      <div className="relative w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: state.on ? glow : 'hsl(var(--muted))',
              boxShadow: state.on ? `0 0 8px ${glow}` : 'none',
              transition: 'all 300ms var(--easing)',
            }}
          />
          <span className="text-[11px] font-medium text-foreground/80 truncate">
            {state.on ? (state.scene ? state.scene[0].toUpperCase() + state.scene.slice(1) : 'On') : 'Off'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {!compact && (
            <button
              onClick={() => setShowSettings(s => !s)}
              className="rounded-full p-1.5 transition-transform active:scale-90 text-muted-foreground"
              style={{ background: 'hsl(var(--surface-bright))' }}
              aria-label="Backend settings"
            >
              <Settings className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={togglePower}
            className="rounded-full p-2 transition-transform active:scale-90"
            style={{
              background: state.on ? glow : 'hsl(var(--surface-bright))',
              color: state.on ? '#0a0a0a' : 'hsl(var(--foreground))',
            }}
            aria-label={state.on ? 'Turn off' : 'Turn on'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showSettings && !compact && (
        <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />
      )}

      {/* color wheel */}
      {!showSettings && (
        <div className="flex-1 w-full flex items-center justify-center min-h-0">
          <ColorWheel
            size={wheelSize}
            color={state.color}
            on={state.on}
            brightness={state.brightness}
            onChange={setColor}
          />
        </div>
      )}

      {/* brightness */}
      <div className="w-full px-1">
        <BrightnessSlider value={state.brightness} color={glow} on={state.on} onChange={setBrightness} />
      </div>

      {/* presets */}
      {!compact && !showSettings && (
        <div className="w-full flex items-center justify-center gap-1.5 flex-wrap">
          {SWATCHES.map(c => {
            const active = state.color.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="rounded-full transition-transform active:scale-90"
                style={{
                  width: 18, height: 18,
                  background: c,
                  boxShadow: active
                    ? `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${c}, 0 0 10px ${c}`
                    : 'inset 0 0 0 1px hsl(var(--border))',
                  transition: 'box-shadow 200ms var(--easing), transform 120ms var(--easing)',
                }}
                aria-label={`Preset ${c}`}
              />
            );
          })}
        </div>
      )}

      {/* scenes */}
      {!compact && !showSettings && (
        <div className="w-full grid grid-cols-5 gap-1">
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
                  borderColor: active ? `${s.tint}80` : 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  boxShadow: active ? `0 0 12px -4px ${s.tint}` : 'none',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: s.tint, boxShadow: `0 0 6px ${s.tint}` }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── backend settings ───────────────────── */

const BACKENDS: { key: LightBackend; label: string }[] = [
  { key: 'magic_home',     label: 'Magic Home' },
  { key: 'home_assistant', label: 'Home Asst' },
  { key: 'webhook',        label: 'Webhook' },
  { key: 'google',         label: 'Google' },
  { key: 'none',           label: 'Off' },
];

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-[11px] px-2 py-1 rounded-md outline-none"
        style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        }}
      />
    </label>
  );
}

function SettingsPanel({
  settings, onChange, onClose,
}: {
  settings: ReturnType<typeof useLights>['settings'];
  onChange: (patch: Partial<ReturnType<typeof useLights>['settings']>) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="w-full rounded-lg p-2.5 flex flex-col gap-2"
      style={{ background: 'hsl(var(--surface-bright))', border: '1px solid hsl(var(--border))' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Backend</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {BACKENDS.map(b => {
          const active = settings.backend === b.key;
          return (
            <button
              key={b.key}
              onClick={() => onChange({ backend: b.key })}
              className="py-1 rounded-md text-[10px] transition-all active:scale-95"
              style={{
                background: active ? 'hsl(var(--foreground))' : 'hsl(var(--surface))',
                color: active ? 'hsl(var(--background))' : 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              }}
            >{b.label}</button>
          );
        })}
      </div>

      {settings.backend === 'magic_home' && (
        <div className="flex flex-col gap-1.5">
          <Field
            label="Device IP"
            value={settings.magic_home?.ip || ''}
            onChange={(v) => onChange({ magic_home: { ...settings.magic_home, ip: v } })}
            placeholder="192.168.68.110"
          />
          <Field
            label="Bridge port"
            value={String(settings.magic_home?.port ?? 8080)}
            onChange={(v) => onChange({ magic_home: { ...settings.magic_home, port: Number(v) || 8080 } })}
            placeholder="8080"
          />
          <Field
            label="Public bridge URL (optional)"
            value={settings.magic_home?.bridgeUrl || ''}
            onChange={(v) => onChange({ magic_home: { ...settings.magic_home, bridgeUrl: v } })}
            placeholder="https://tunnel.example/lights"
          />
          <p className="text-[9px] text-muted-foreground leading-tight">
            Direct LAN to the strip. Needs a tiny flux_led HTTP bridge running on the same network. Public URL is only required if controlling from outside WiFi.
          </p>
        </div>
      )}

      {settings.backend === 'webhook' && (
        <div className="flex flex-col gap-1.5">
          <Field label="Webhook URL" value={settings.webhook?.url || ''}
            onChange={(v) => onChange({ webhook: { ...settings.webhook, url: v } })} placeholder="https://..." />
          <Field label="Auth token (optional)" value={settings.webhook?.token || ''} type="password"
            onChange={(v) => onChange({ webhook: { ...settings.webhook, token: v } })} />
        </div>
      )}

      {settings.backend === 'home_assistant' && (
        <div className="flex flex-col gap-1.5">
          <Field label="Base URL" value={settings.home_assistant?.baseUrl || ''}
            onChange={(v) => onChange({ home_assistant: { ...settings.home_assistant, baseUrl: v } })}
            placeholder="http://192.168.1.10:8123" />
          <Field label="Long-lived token" value={settings.home_assistant?.token || ''} type="password"
            onChange={(v) => onChange({ home_assistant: { ...settings.home_assistant, token: v } })} />
          <Field label="Entity ID" value={settings.home_assistant?.entityId || ''}
            onChange={(v) => onChange({ home_assistant: { ...settings.home_assistant, entityId: v } })}
            placeholder="light.magic_home_strip" />
        </div>
      )}

      {settings.backend === 'google' && (
        <div className="flex flex-col gap-1.5">
          <Field label="Relay URL" value={settings.google?.relayUrl || ''}
            onChange={(v) => onChange({ google: { ...settings.google, relayUrl: v } })}
            placeholder="https://relay.example.com/assistant" />
          <Field label="Auth token (optional)" value={settings.google?.token || ''} type="password"
            onChange={(v) => onChange({ google: { ...settings.google, token: v } })} />
          <Field label="Device name" value={settings.google?.deviceName || ''}
            onChange={(v) => onChange({ google: { ...settings.google, deviceName: v } })}
            placeholder="bedroom strip" />
        </div>
      )}
    </div>
  );
}

export type ClockStyle =
  | 'minimal-digital'
  | 'bold-typo'
  | 'pixel-retro'
  | 'analog'
  | 'futuristic-neon'
  | 'glass'
  | 'thin-minimal'
  | 'split-layout'
  | 'gradient-wave'
  | 'dot-matrix';

export type ClockFont =
  | 'system'
  | 'mono'
  | 'serif'
  | 'condensed'
  | 'rounded'
  | 'pixel'
  | 'display'
  | 'handwritten';

export type ClockBgType = 'none' | 'gradient' | 'image';

export type ClockGradient =
  | 'sunset'
  | 'ocean'
  | 'aurora'
  | 'midnight'
  | 'fire'
  | 'forest'
  | 'lavender'
  | 'noir';

export interface ClockSettings {
  style: ClockStyle;
  font: ClockFont;
  showSeconds: boolean;
  showDate: boolean;
  showAmPm: boolean;
  hour12: boolean;
  glowEffect: boolean;
  fontSize: number;
  bgType: ClockBgType;
  bgGradient: ClockGradient;
  bgImage: string;
  bgOpacity: number;
}

export const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
  style: 'minimal-digital',
  font: 'system',
  showSeconds: false,
  showDate: true,
  showAmPm: false,
  hour12: false,
  glowEffect: true,
  fontSize: 1,
  bgType: 'none',
  bgGradient: 'sunset',
  bgImage: '',
  bgOpacity: 0.4,
};

export const CLOCK_STYLE_LABELS: Record<ClockStyle, string> = {
  'minimal-digital': 'Minimal',
  'bold-typo': 'Bold',
  'pixel-retro': 'Pixel',
  'analog': 'Analog',
  'futuristic-neon': 'Neon',
  'glass': 'Glass',
  'thin-minimal': 'Thin',
  'split-layout': 'Split',
  'gradient-wave': 'Gradient',
  'dot-matrix': 'Matrix',
};

export const CLOCK_FONT_LABELS: Record<ClockFont, string> = {
  system: 'System',
  mono: 'Mono',
  serif: 'Serif',
  condensed: 'Condensed',
  rounded: 'Rounded',
  pixel: 'Pixel',
  display: 'Display',
  handwritten: 'Script',
};

export const FONT_FAMILIES: Record<ClockFont, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"SF Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
  serif: '"Georgia", "Times New Roman", "Playfair Display", serif',
  condensed: '"Arial Narrow", "Barlow Condensed", sans-serif',
  rounded: '"Nunito", "Varela Round", system-ui, sans-serif',
  pixel: '"Courier New", "Press Start 2P", monospace',
  display: '"Impact", "Anton", "Bebas Neue", sans-serif',
  handwritten: '"Segoe Script", "Brush Script MT", cursive',
};

export const GRADIENT_PRESETS: Record<ClockGradient, { label: string; css: string }> = {
  sunset: { label: '🌅 Sunset', css: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)' },
  ocean: { label: '🌊 Ocean', css: 'linear-gradient(135deg, #06b6d4, #3b82f6, #1e3a5f)' },
  aurora: { label: '🌌 Aurora', css: 'linear-gradient(135deg, #10b981, #06b6d4, #8b5cf6)' },
  midnight: { label: '🌙 Midnight', css: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)' },
  fire: { label: '🔥 Fire', css: 'linear-gradient(135deg, #ef4444, #f97316, #eab308)' },
  forest: { label: '🌲 Forest', css: 'linear-gradient(135deg, #064e3b, #065f46, #047857)' },
  lavender: { label: '💜 Lavender', css: 'linear-gradient(135deg, #7c3aed, #a78bfa, #c4b5fd)' },
  noir: { label: '⬛ Noir', css: 'linear-gradient(135deg, #111, #222, #111)' },
};

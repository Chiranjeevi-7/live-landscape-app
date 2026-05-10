export type WidgetType = 'clock' | 'date' | 'timer' | 'stopwatch' | 'spotify' | 'lyrics' | 'gif' | 'weather' | 'pomodoro' | 'notes';

export type WidgetShape = 'rectangle' | 'rounded' | 'squircle' | 'circle' | 'edge-to-edge';

export interface SubWidget {
  id: string;
  type: WidgetType;
  settings?: Record<string, unknown>;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: WidgetShape;
  settings?: Record<string, unknown>;
  subWidgets?: SubWidget[];
  activeSubIndex?: number;
}

export interface SlotConfig {
  widgets: { id: string; type: WidgetType; settings?: Record<string, unknown> }[];
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  slots?: SlotConfig[];
}

export interface ThemeConfig {
  name: string;
  className: string;
}

export const THEMES: ThemeConfig[] = [
  { name: 'Default', className: '' },
  { name: 'Lofi', className: 'theme-lofi' },
  { name: 'Cyberpunk', className: 'theme-cyberpunk' },
  { name: 'Minimal', className: 'theme-minimal' },
  { name: 'Vaporwave', className: 'theme-vaporwave' },
  { name: 'Forest', className: 'theme-forest' },
  { name: 'Ocean', className: 'theme-ocean' },
  { name: 'Sunset', className: 'theme-sunset' },
  { name: 'Midnight', className: 'theme-midnight' },
  { name: 'Glass', className: 'theme-glass' },
];

export const ACCENT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

export const WIDGET_LABELS: Record<WidgetType, string> = {
  clock: 'Clock',
  date: 'Date',
  timer: 'Timer',
  stopwatch: 'Stopwatch',
  spotify: 'Spotify Player',
  lyrics: 'Lyrics',
  gif: 'GIF / Image',
  weather: 'Weather',
  pomodoro: 'Pomodoro',
  notes: 'Notes / Todo',
};

export const SHAPE_LABELS: Record<WidgetShape, string> = {
  'rectangle': 'Sharp',
  'rounded': 'Rounded',
  'squircle': 'Squircle',
  'circle': 'Circle',
  'edge-to-edge': 'Full',
};

export const MAX_WIDGETS = 6;

export const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: [
    { id: 'clock-1', type: 'clock', x: 2, y: 5, w: 30, h: 90, shape: 'squircle' },
    { id: 'spotify-1', type: 'spotify', x: 35, y: 5, w: 30, h: 90, shape: 'squircle' },
    { id: 'lyrics-1', type: 'lyrics', x: 68, y: 5, w: 30, h: 90, shape: 'squircle' },
  ],
};

let _counter = 0;
export function generateWidgetId(type: WidgetType): string {
  _counter++;
  return `${type}-${Date.now()}-${_counter}`;
}

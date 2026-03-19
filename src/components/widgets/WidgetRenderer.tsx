import type { WidgetType } from '@/types/dashboard';
import ClockWidget from './ClockWidget';
import DateWidget from './DateWidget';
import TimerWidget from './TimerWidget';
import StopwatchWidget from './StopwatchWidget';
import SpotifyWidget from './SpotifyWidget';
import LyricsWidget from './LyricsWidget';
import GifWidget from './GifWidget';
import WeatherWidget from './WeatherWidget';
import PomodoroWidget from './PomodoroWidget';
import NotesWidget from './NotesWidget';

const WIDGET_MAP: Record<WidgetType, React.ComponentType> = {
  clock: ClockWidget,
  date: DateWidget,
  timer: TimerWidget,
  stopwatch: StopwatchWidget,
  spotify: SpotifyWidget,
  lyrics: LyricsWidget,
  gif: GifWidget,
  weather: WeatherWidget,
  pomodoro: PomodoroWidget,
  notes: NotesWidget,
};

export default function WidgetRenderer({ type }: { type: WidgetType }) {
  const Component = WIDGET_MAP[type];
  if (!Component) return null;
  return <Component />;
}

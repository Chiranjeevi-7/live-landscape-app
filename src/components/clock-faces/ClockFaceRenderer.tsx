import type { ClockSettings, ClockStyle } from '@/types/clock';
import MinimalDigital from './MinimalDigital';
import BoldTypo from './BoldTypo';
import PixelRetro from './PixelRetro';
import AnalogClock from './AnalogClock';
import FuturisticNeon from './FuturisticNeon';
import GlassClock from './GlassClock';
import ThinMinimal from './ThinMinimal';
import SplitLayout from './SplitLayout';
import GradientWave from './GradientWave';
import DotMatrix from './DotMatrix';

const FACE_MAP: Record<ClockStyle, React.ComponentType<{ settings: ClockSettings }>> = {
  'minimal-digital': MinimalDigital,
  'bold-typo': BoldTypo,
  'pixel-retro': PixelRetro,
  'analog': AnalogClock,
  'futuristic-neon': FuturisticNeon,
  'glass': GlassClock,
  'thin-minimal': ThinMinimal,
  'split-layout': SplitLayout,
  'gradient-wave': GradientWave,
  'dot-matrix': DotMatrix,
};

export default function ClockFaceRenderer({ settings }: { settings: ClockSettings }) {
  const Face = FACE_MAP[settings.style] || MinimalDigital;
  return <Face settings={settings} />;
}

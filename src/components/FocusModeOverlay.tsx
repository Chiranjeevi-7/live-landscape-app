import { Eye, EyeOff } from 'lucide-react';

interface Props {
  isFocused: boolean;
  onToggle: () => void;
}

export default function FocusModeOverlay({ isFocused, onToggle }: Props) {
  return (
    <>
      {/* Focus mode vignette */}
      {isFocused && (
        <div
          className="fixed inset-0 pointer-events-none z-[5] transition-opacity duration-700"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 100%)',
            opacity: 0.6,
          }}
        />
      )}

      {/* Floating focus toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`fixed top-4 right-4 z-50 p-2.5 rounded-full transition-all duration-500 ${
          isFocused
            ? 'scale-110'
            : 'opacity-0 hover:opacity-100 focus:opacity-100'
        }`}
        style={{
          background: isFocused ? 'hsl(var(--accent) / 0.2)' : 'hsl(var(--surface))',
          border: `1px solid hsl(var(--accent) / ${isFocused ? '0.4' : '0.1'})`,
          backdropFilter: 'blur(12px)',
          boxShadow: isFocused ? '0 0 20px hsl(var(--accent-glow))' : 'none',
        }}
        title={isFocused ? 'Exit Focus Mode' : 'Enter Focus Mode'}
      >
        {isFocused ? (
          <EyeOff className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
        ) : (
          <Eye className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </>
  );
}

import { useEffect, useRef } from 'react';
import { ACCENT_COLORS } from '@/types/dashboard';

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export default function AmbientVisualizer({ accentIndex }: { accentIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const { r, g, b } = hexToRgb(ACCENT_COLORS[accentIndex] || ACCENT_COLORS[0]);

    const resize = () => {
      canvas.width = window.innerWidth * 0.5;
      canvas.height = window.innerHeight * 0.5;
    };
    window.addEventListener('resize', resize);
    resize();

    const orbs = [
      { cx: 0.3, cy: 0.4, radius: 0.35, phase: 0, speed: 0.0003 },
      { cx: 0.7, cy: 0.6, radius: 0.3, phase: 2, speed: 0.0004 },
      { cx: 0.5, cy: 0.3, radius: 0.25, phase: 4, speed: 0.0005 },
    ];

    const draw = (time: number) => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const orb of orbs) {
        const drift = Math.sin(time * orb.speed + orb.phase) * 0.06;
        const cx = (orb.cx + drift) * w;
        const cy = (orb.cy + Math.cos(time * orb.speed * 0.7 + orb.phase) * 0.04) * h;
        const radius = orb.radius * Math.min(w, h);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.06)`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.02)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [accentIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, width: '100%', height: '100%', opacity: 0.8 }}
    />
  );
}

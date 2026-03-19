import { useEffect, useRef } from 'react';
import { ACCENT_COLORS } from '@/types/dashboard';

export default function AmbientVisualizer({ accentIndex }: { accentIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const hex = ACCENT_COLORS[accentIndex] || ACCENT_COLORS[0];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = hex;
      const s = 1 + Math.sin(Date.now() / 1500) * 0.06;
      ctx.globalAlpha = 0.04;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, (w / 3) * s, 0, Math.PI * 2);
      ctx.fill();
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [accentIndex]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
  );
}

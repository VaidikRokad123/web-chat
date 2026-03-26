import { useEffect, useRef } from 'react';

export default function BinaryRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h, columns, drops;
    const fontSize = 14;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      columns = Math.floor(w / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.fillStyle = 'rgba(6, 8, 13, 0.06)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;

      for (let i = 0; i < columns; i++) {
        const char = Math.random() > 0.5 ? '1' : '0';
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Vary brightness
        const brightness = 0.15 + Math.random() * 0.25;
        ctx.fillStyle = `rgba(0, 229, 255, ${brightness})`;
        ctx.fillText(char, x, y);

        // Random head glow
        if (Math.random() > 0.97) {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
          ctx.fillText(char, x, y);
        }

        if (y > h && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }
    }

    const interval = setInterval(draw, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

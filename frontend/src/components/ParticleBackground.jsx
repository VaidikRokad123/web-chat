import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const PARTICLE_COUNT = 90;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function createParticle(canvasW, canvasH) {
  return {
    x: randomBetween(0, canvasW),
    y: randomBetween(0, canvasH),
    w: randomBetween(4, 9),
    h: randomBetween(3, 6),
    angle: randomBetween(0, Math.PI * 2),
    rotSpeed: randomBetween(-0.008, 0.008),
    vx: randomBetween(-0.25, 0.25),
    vy: randomBetween(-0.25, 0.25),
    alpha: randomBetween(0.25, 0.65),
    hue: randomBetween(0, 1),
  };
}

function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas.width, canvas.height)
      );
    }

    resize();
    window.addEventListener('resize', resize);

    function onMouseMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener('mousemove', onMouseMove);

    function getColor(p, isDark) {
      const r1 = isDark ? [162, 155, 254] : [108, 92, 231];
      const r2 = isDark ? [253, 121, 168] : [225, 112, 85];
      const r = Math.round(r1[0] + (r2[0] - r1[0]) * p.hue);
      const g = Math.round(r1[1] + (r2[1] - r1[1]) * p.hue);
      const b = Math.round(r1[2] + (r2[2] - r1[2]) * p.hue);
      return `rgba(${r},${g},${b},${p.alpha})`;
    }

    function draw() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const W = canvas.width;
      const H = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, W, H);

      for (const p of particlesRef.current) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 140) {
          const force = (140 - dist) / 140;
          const pushX = (dx / dist) * force * 1.4;
          const pushY = (dy / dist) * force * 1.4;
          p.x += pushX;
          p.y += pushY;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.rotSpeed;

        const buf = 20;
        if (p.x < -buf) p.x = W + buf;
        if (p.x > W + buf) p.x = -buf;
        if (p.y < -buf) p.y = H + buf;
        if (p.y > H + buf) p.y = -buf;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = getColor(p, isDark);

        const rx = 2;
        const hw = p.w / 2;
        const hh = p.h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw + rx, -hh);
        ctx.lineTo(hw - rx, -hh);
        ctx.quadraticCurveTo(hw, -hh, hw, -hh + rx);
        ctx.lineTo(hw, hh - rx);
        ctx.quadraticCurveTo(hw, hh, hw - rx, hh);
        ctx.lineTo(-hw + rx, hh);
        ctx.quadraticCurveTo(-hw, hh, -hw, hh - rx);
        ctx.lineTo(-hw, -hh + rx);
        ctx.quadraticCurveTo(-hw, -hh, -hw + rx, -hh);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

export default function ParticleBackground() {
  return createPortal(<ParticleCanvas />, document.body);
}

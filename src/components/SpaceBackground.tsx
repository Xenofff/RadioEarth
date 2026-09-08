import React, { useEffect, useRef } from 'react';

// Seeded PRNG for deterministic celestial star positioning
function createPRNG(seed: number) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Star {
  x: number; // 0..1
  y: number; // 0..1
  r: number;
  baseAlpha: number;
  color: string;
  isTwinkling: boolean;
  twinkleSpeed: number;
  twinklePhase: number;
  hasGlow: boolean;
}

const STAR_COLORS = [
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#D1FAE5', // pale emerald
  '#16C683', // mint brand
  '#BAE6FD', // icy cyan
  '#FEF08A', // warm yellow
];

export const SpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Generate stars deterministically
    const prng = createPRNG(42137);
    const starList: Star[] = [];

    // 1. 220 Static Micro Background Stars
    for (let i = 0; i < 220; i++) {
      starList.push({
        x: prng(),
        y: prng(),
        r: 0.6 + prng() * 0.6,
        baseAlpha: 0.25 + prng() * 0.4,
        color: '#FFFFFF',
        isTwinkling: false,
        twinkleSpeed: 0,
        twinklePhase: 0,
        hasGlow: false,
      });
    }

    // 2. 50 Mid-field Stars with spectral colors (some twinkle)
    for (let i = 0; i < 50; i++) {
      const colorIndex = Math.floor(prng() * STAR_COLORS.length);
      const twinkles = prng() > 0.4;
      starList.push({
        x: prng(),
        y: prng(),
        r: 1.1 + prng() * 0.7,
        baseAlpha: 0.5 + prng() * 0.4,
        color: STAR_COLORS[colorIndex],
        isTwinkling: twinkles,
        twinkleSpeed: 1.2 + prng() * 2.0,
        twinklePhase: prng() * Math.PI * 2,
        hasGlow: false,
      });
    }

    // 3. 16 Hero Stars with subtle glows & spikes
    for (let i = 0; i < 16; i++) {
      const colorIndex = Math.floor(prng() * 4);
      starList.push({
        x: 0.04 + prng() * 0.92,
        y: 0.04 + prng() * 0.92,
        r: 2.0 + prng() * 0.8,
        baseAlpha: 0.85 + prng() * 0.15,
        color: STAR_COLORS[colorIndex],
        isTwinkling: true,
        twinkleSpeed: 0.8 + prng() * 1.5,
        twinklePhase: prng() * Math.PI * 2,
        hasGlow: true,
      });
    }

    // Constellation asterisms
    const constellations = [
      [
        { x: 0.12, y: 0.15 },
        { x: 0.18, y: 0.11 },
        { x: 0.25, y: 0.19 },
        { x: 0.31, y: 0.14 },
      ],
      [
        { x: 0.82, y: 0.78 },
        { x: 0.88, y: 0.72 },
        { x: 0.94, y: 0.81 },
        { x: 0.89, y: 0.9 },
      ],
    ];

    // Offscreen canvas for pre-rendering static stars & constellation lines
    const staticCanvas = document.createElement('canvas');
    const staticCtx = staticCanvas.getContext('2d');

    let width = 0;
    let height = 0;

    const renderStaticPass = () => {
      if (!staticCtx) return;
      staticCanvas.width = width;
      staticCanvas.height = height;
      staticCtx.clearRect(0, 0, width, height);

      // Draw constellation lines
      staticCtx.strokeStyle = 'rgba(22, 198, 131, 0.22)';
      staticCtx.lineWidth = 0.75;
      staticCtx.setLineDash([2, 4]);

      constellations.forEach((asterism) => {
        staticCtx.beginPath();
        asterism.forEach((p, idx) => {
          const px = p.x * width;
          const py = p.y * height;
          if (idx === 0) staticCtx.moveTo(px, py);
          else staticCtx.lineTo(px, py);
        });
        staticCtx.stroke();

        // Node dots
        staticCtx.fillStyle = 'rgba(22, 198, 131, 0.7)';
        asterism.forEach((p) => {
          staticCtx.beginPath();
          staticCtx.arc(p.x * width, p.y * height, 1.8, 0, Math.PI * 2);
          staticCtx.fill();
        });
      });
      staticCtx.setLineDash([]);

      // Draw static stars
      starList.forEach((star) => {
        if (star.isTwinkling) return;
        staticCtx.fillStyle = star.color;
        staticCtx.globalAlpha = star.baseAlpha;
        staticCtx.beginPath();
        staticCtx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        staticCtx.fill();
      });
      staticCtx.globalAlpha = 1.0;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap DPR at 1.5 for optimal performance on Retina
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      renderStaticPass();
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Animation loop throttled to 30 FPS for twinkling stars (uses <0.5% CPU)
    let animationFrameId: number;
    let lastDrawTime = 0;
    const targetInterval = 1000 / 30; // 30 FPS is silky smooth for cosmic twinkling

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = currentTime - lastDrawTime;
      if (elapsed < targetInterval) return;
      lastDrawTime = currentTime - (elapsed % targetInterval);

      ctx.clearRect(0, 0, width, height);

      // 1. Draw static starfield from pre-rendered offscreen buffer (instant blit)
      if (staticCanvas.width > 0 && staticCanvas.height > 0) {
        ctx.drawImage(staticCanvas, 0, 0, width, height);
      }

      // 2. Draw only active twinkling & hero stars (~30 stars total)
      const timeSec = currentTime * 0.001;
      starList.forEach((star) => {
        if (!star.isTwinkling) return;

        const sx = star.x * width;
        const sy = star.y * height;
        const sinVal = Math.sin(timeSec * star.twinkleSpeed + star.twinklePhase);
        const currentAlpha = Math.max(0.15, Math.min(1.0, star.baseAlpha + sinVal * 0.35));

        // Soft halo for hero stars
        if (star.hasGlow) {
          ctx.fillStyle = star.color;
          ctx.globalAlpha = currentAlpha * 0.2;
          ctx.beginPath();
          ctx.arc(sx, sy, star.r * 2.8, 0, Math.PI * 2);
          ctx.fill();

          // Subtle cross spikes
          ctx.strokeStyle = star.color;
          ctx.globalAlpha = currentAlpha * 0.6;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(sx - 6, sy);
          ctx.lineTo(sx + 6, sy);
          ctx.moveTo(sx, sy - 6);
          ctx.lineTo(sx, sy + 6);
          ctx.stroke();
        }

        // Core star
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#07090D]">
      {/* 1. Deep Space Cosmic Nebulas (Smooth CSS radial gradients without expensive blur filters) */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full opacity-60 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(22, 198, 131, 0.14) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-[15%] -right-[10%] w-[70vw] h-[70vw] rounded-full opacity-50 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[25%] -right-[15%] w-[55vw] h-[55vw] rounded-full opacity-40 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.10) 0%, rgba(14, 165, 233, 0.03) 45%, transparent 70%)',
        }}
      />

      {/* 2. Planetary Exosphere Ambient Glow */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-70"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(22, 198, 131, 0.09) 0%, rgba(15, 23, 42, 0.25) 38%, rgba(7, 9, 13, 0) 65%)',
        }}
      />

      {/* 3. Ultra-low overhead Canvas2D Starfield */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 4. Elegant Meteors (GPU compositor accelerated translate3d) */}
      <div className="absolute top-[18%] right-[22%] w-[140px] h-[1.5px] animate-meteor-1 origin-right will-change-transform">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'linear-gradient(to right, rgba(22, 198, 131, 0) 0%, rgba(22, 198, 131, 0.4) 40%, rgba(255, 255, 255, 1) 100%)',
          }}
        />
      </div>

      <div className="absolute top-[45%] left-[65%] w-[160px] h-[1.5px] animate-meteor-2 origin-right will-change-transform">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(147, 197, 253, 0.5) 50%, rgba(255, 255, 255, 1) 100%)',
          }}
        />
      </div>
    </div>
  );
};

export default SpaceBackground;

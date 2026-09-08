import React, { useEffect, useRef, useMemo } from 'react';

// Seeded PRNG for deterministic celestial star positioning
function createPRNG(seed: number) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface TwinkleStar {
  id: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  r: number;
  color: string;
  twinkleClass: string;
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

  // Generate 20 hero twinkling stars for GPU compositor animation
  const twinklingStars: TwinkleStar[] = useMemo(() => {
    const prng = createPRNG(42137);
    const list: TwinkleStar[] = [];
    const classes = ['animate-twinkle-1', 'animate-twinkle-2', 'animate-twinkle-3'];

    for (let i = 0; i < 24; i++) {
      const colorIndex = Math.floor(prng() * STAR_COLORS.length);
      list.push({
        id: i,
        x: 4 + prng() * 92,
        y: 4 + prng() * 92,
        r: 1.8 + prng() * 1.0,
        color: STAR_COLORS[colorIndex],
        twinkleClass: classes[i % 3],
      });
    }
    return list;
  }, []);

  // Static celestial starfield (drawn ONCE on mount/resize, 0% CPU consumption)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prng = createPRNG(78912);

    // 240 micro static background stars
    const staticStars: { x: number; y: number; r: number; alpha: number; color: string }[] = [];
    for (let i = 0; i < 240; i++) {
      staticStars.push({
        x: prng(),
        y: prng(),
        r: 0.5 + prng() * 0.7,
        alpha: 0.2 + prng() * 0.45,
        color: '#FFFFFF',
      });
    }

    // 60 mid-field static colored stars
    for (let i = 0; i < 60; i++) {
      const colorIndex = Math.floor(prng() * STAR_COLORS.length);
      staticStars.push({
        x: prng(),
        y: prng(),
        r: 0.9 + prng() * 0.7,
        alpha: 0.45 + prng() * 0.35,
        color: STAR_COLORS[colorIndex],
      });
    }

    // Constellation asterisms in corners
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

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Draw constellation lines
      ctx.strokeStyle = 'rgba(22, 198, 131, 0.2)';
      ctx.lineWidth = 0.75;
      ctx.setLineDash([2, 4]);

      constellations.forEach((asterism) => {
        ctx.beginPath();
        asterism.forEach((p, idx) => {
          const px = p.x * width;
          const py = p.y * height;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Node dots
        ctx.fillStyle = 'rgba(22, 198, 131, 0.75)';
        asterism.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x * width, p.y * height, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      ctx.setLineDash([]);

      // Draw static stars
      staticStars.forEach((star) => {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    render();
    window.addEventListener('resize', render, { passive: true });

    return () => {
      window.removeEventListener('resize', render);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#07090D]">
      {/* 1. Deep Space Cosmic Nebulas (Smooth CSS radial gradients, 0% CPU, 100% GPU composited) */}
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

      {/* 3. Static Starfield Canvas (Rendered ONCE on load, 0% CPU at runtime) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 4. Twinkling Hero Stars (Pure CSS opacity animation on GPU compositor, 0% CPU) */}
      {twinklingStars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full ${star.twinkleClass}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.r * 2}px`,
            height: `${star.r * 2}px`,
            backgroundColor: star.color,
            boxShadow: `0 0 ${star.r * 2.5}px ${star.color}`,
          }}
        />
      ))}

      {/* 5. Authentic Forward-Flying Comets (Distributed across 4 distinct sky quadrants) */}

      {/* Comet 1: Upper-Right quadrant flying down-left */}
      <div className="absolute top-[8%] left-[68%] animate-meteor-flight-1 pointer-events-none will-change-transform origin-left">
        <div className="flex items-center">
          {/* Fading trail behind */}
          <div
            className="w-[130px] h-[1.5px]"
            style={{
              background:
                'linear-gradient(to right, rgba(22, 198, 131, 0) 0%, rgba(22, 198, 131, 0.45) 50%, rgba(255, 255, 255, 0.95) 100%)',
            }}
          />
          {/* Leading luminous head in front */}
          <div className="w-1.5 h-1.5 -ml-1 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_12px_#16C683]" />
        </div>
      </div>

      {/* Comet 2: Upper-Left quadrant flying down-right */}
      <div className="absolute top-[14%] left-[10%] animate-meteor-flight-2 pointer-events-none will-change-transform origin-left">
        <div className="flex items-center">
          {/* Fading trail behind */}
          <div
            className="w-[140px] h-[1.5px]"
            style={{
              background:
                'linear-gradient(to right, rgba(147, 197, 253, 0) 0%, rgba(147, 197, 253, 0.5) 50%, rgba(255, 255, 255, 0.95) 100%)',
            }}
          />
          {/* Leading luminous head in front */}
          <div className="w-1.5 h-1.5 -ml-1 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_12px_#93C5FD]" />
        </div>
      </div>

      {/* Comet 3: Mid/Lower-Right quadrant flying down-left */}
      <div className="absolute top-[52%] left-[74%] animate-meteor-flight-3 pointer-events-none will-change-transform origin-left">
        <div className="flex items-center">
          {/* Fading trail behind */}
          <div
            className="w-[125px] h-[1.5px]"
            style={{
              background:
                'linear-gradient(to right, rgba(254, 240, 138, 0) 0%, rgba(254, 240, 138, 0.4) 50%, rgba(255, 255, 255, 0.95) 100%)',
            }}
          />
          {/* Leading luminous head in front */}
          <div className="w-1.5 h-1.5 -ml-1 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_10px_#FEF08A]" />
        </div>
      </div>

      {/* Comet 4: Northern sky (Upper Center) flying down-right */}
      <div className="absolute top-[5%] left-[34%] animate-meteor-flight-4 pointer-events-none will-change-transform origin-left">
        <div className="flex items-center">
          {/* Fading trail behind */}
          <div
            className="w-[150px] h-[1.5px]"
            style={{
              background:
                'linear-gradient(to right, rgba(22, 198, 131, 0) 0%, rgba(22, 198, 131, 0.45) 50%, rgba(255, 255, 255, 0.95) 100%)',
            }}
          />
          {/* Leading luminous head in front */}
          <div className="w-1.5 h-1.5 -ml-1 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_12px_#16C683]" />
        </div>
      </div>
    </div>
  );
};

export default SpaceBackground;

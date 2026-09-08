import React, { useMemo } from 'react';

// Seeded PRNG for deterministic celestial star positioning
function createPRNG(seed: number) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Star {
  id: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  r: number; // radius in px
  opacity: number;
  color: string;
  twinkleClass?: string;
  hasSpike?: boolean;
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
  // Generate 420 stars with diverse sizes, colors and twinkles
  const { stars, constellations } = useMemo(() => {
    const prng = createPRNG(42137);
    const starList: Star[] = [];

    // 1. 280 Micro Background Stars
    for (let i = 0; i < 280; i++) {
      starList.push({
        id: i,
        x: prng() * 100,
        y: prng() * 100,
        r: 0.5 + prng() * 0.7,
        opacity: 0.2 + prng() * 0.45,
        color: '#FFFFFF',
      });
    }

    // 2. 120 Mid-field Stars with Colors & Twinkling
    for (let i = 280; i < 400; i++) {
      const colorIndex = Math.floor(prng() * STAR_COLORS.length);
      const twinkleRand = prng();
      let twinkleClass: string | undefined;
      if (twinkleRand < 0.25) twinkleClass = 'animate-star-fast';
      else if (twinkleRand < 0.55) twinkleClass = 'animate-star-mid';
      else if (twinkleRand < 0.85) twinkleClass = 'animate-star-slow';

      starList.push({
        id: i,
        x: prng() * 100,
        y: prng() * 100,
        r: 1.1 + prng() * 0.9,
        opacity: 0.5 + prng() * 0.45,
        color: STAR_COLORS[colorIndex],
        twinkleClass,
      });
    }

    // 3. 20 Bright Hero Stars with Glow & Diffraction Spikes
    for (let i = 400; i < 420; i++) {
      const colorIndex = Math.floor(prng() * 4); // mostly white & mint
      starList.push({
        id: i,
        x: 4 + prng() * 92,
        y: 4 + prng() * 92,
        r: 2.0 + prng() * 1.2,
        opacity: 0.85 + prng() * 0.15,
        color: STAR_COLORS[colorIndex],
        twinkleClass: prng() > 0.4 ? 'animate-star-mid' : 'animate-star-slow',
        hasSpike: prng() > 0.35,
      });
    }

    // 4. Subtle Constellation Lines connecting key stars in corners
    const constellations = [
      // Top-Left Asterism
      [
        { x: 12, y: 15 },
        { x: 18, y: 11 },
        { x: 25, y: 19 },
        { x: 31, y: 14 },
      ],
      // Bottom-Right Asterism
      [
        { x: 82, y: 78 },
        { x: 88, y: 72 },
        { x: 94, y: 81 },
        { x: 89, y: 90 },
      ],
    ];

    return { stars: starList, constellations };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#07090D]">
      {/* 1. Deep Space Cosmic Nebulas (Multi-layer organic gas clouds) */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full opacity-40 blur-3xl animate-nebula"
        style={{
          background: 'radial-gradient(circle, rgba(22, 198, 131, 0.12) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-[15%] -right-[10%] w-[70vw] h-[70vw] rounded-full opacity-35 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[25%] -right-[15%] w-[55vw] h-[55vw] rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(14, 165, 233, 0.03) 45%, transparent 70%)',
        }}
      />

      {/* 2. Planetary Exosphere Backlight (Center ambient glow behind the globe) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(22, 198, 131, 0.09) 0%, rgba(15, 23, 42, 0.25) 38%, rgba(7, 9, 13, 0) 65%)',
        }}
      />

      {/* 3. SVG Celestial Starfield & Constellations */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="star-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint Constellation Asterism Lines */}
        {constellations.map((asterism, aIdx) => (
          <g key={`constellation-${aIdx}`} opacity="0.22">
            <polyline
              points={asterism.map((p) => `${p.x}%,${p.y}%`).join(' ')}
              fill="none"
              stroke="#16C683"
              strokeWidth="0.75"
              strokeDasharray="2,3"
            />
            {asterism.map((p, pIdx) => (
              <circle
                key={`node-${pIdx}`}
                cx={`${p.x}%`}
                cy={`${p.y}%`}
                r="1.8"
                fill="#16C683"
                opacity="0.8"
              />
            ))}
          </g>
        ))}

        {/* Stars */}
        {stars.map((star) => {
          return (
            <g
              key={star.id}
              className={star.twinkleClass}
              style={{
                transformOrigin: `${star.x}% ${star.y}%`,
              }}
            >
              {/* Soft Star Halo for Bright Stars */}
              {star.r > 2.0 && (
                <circle
                  cx={`${star.x}%`}
                  cy={`${star.y}%`}
                  r={star.r * 2.6}
                  fill={star.color}
                  opacity={star.opacity * 0.25}
                  filter="url(#star-glow)"
                />
              )}

              {/* Core Star Dot */}
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.r}
                fill={star.color}
                opacity={star.opacity}
              />

              {/* 4-Point Diffraction Cross Spikes for Hero Stars */}
              {star.hasSpike && (
                <g opacity={star.opacity * 0.75}>
                  {/* Horizontal spike */}
                  <line
                    x1={`calc(${star.x}% - 6px)`}
                    y1={`${star.y}%`}
                    x2={`calc(${star.x}% + 6px)`}
                    y2={`${star.y}%`}
                    stroke={star.color}
                    strokeWidth="0.6"
                  />
                  {/* Vertical spike */}
                  <line
                    x1={`${star.x}%`}
                    y1={`calc(${star.y}% - 6px)`}
                    x2={`${star.x}%`}
                    y2={`calc(${star.y}% + 6px)`}
                    stroke={star.color}
                    strokeWidth="0.6"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* 4. Elegant Shooting Stars (Meteors with glowing tails) */}
      <div className="absolute top-[18%] right-[22%] w-[140px] h-[1.5px] animate-meteor-1 origin-right">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'linear-gradient(to right, rgba(22, 198, 131, 0) 0%, rgba(22, 198, 131, 0.4) 40%, rgba(255, 255, 255, 1) 100%)',
            boxShadow: '0 0 8px rgba(22, 198, 131, 0.8)',
          }}
        />
      </div>

      <div className="absolute top-[45%] left-[65%] w-[160px] h-[1.5px] animate-meteor-2 origin-right">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(147, 197, 253, 0.5) 50%, rgba(255, 255, 255, 1) 100%)',
            boxShadow: '0 0 6px rgba(147, 197, 253, 0.9)',
          }}
        />
      </div>
    </div>
  );
};

export default SpaceBackground;

import React from 'react';

/**
 * Clean, neutral studio daylight background for Light Mode.
 * Free of stars, meteors, and cosmic dust.
 */
export const LightBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#EBF0F5]">
      {/* 1. Subtle smooth radial studio vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, #F8FAFC 0%, #F1F5F9 45%, #E2E8F0 85%, #CBD5E1 100%)',
        }}
      />

      {/* 2. Soft atmospheric daylight halo centered behind the globe */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-70"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.06) 0%, rgba(59, 130, 246, 0.04) 35%, rgba(226, 232, 240, 0) 65%)',
        }}
      />

      {/* 3. Subtle ambient corner gradients for architectural depth */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(203, 213, 225, 0.6) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[65vw] h-[65vw] rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(226, 232, 240, 0.8) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};

export default LightBackground;

import React from 'react';

interface ProximoLogoProps {
  variant?: 'full' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const ProximoLogo: React.FC<ProximoLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  theme = 'auto',
}) => {
  // Dimension presets
  const sizeMap = {
    sm: { icon: 28, height: 28, text: 'text-base' },
    md: { icon: 38, height: 38, text: 'text-xl' },
    lg: { icon: 48, height: 48, text: 'text-2xl' },
    xl: { icon: 64, height: 64, text: 'text-4xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // The Icon is a stylized isometric hexagonal frame:
  // Left side: Dark Navy structure with 3 users silhouette
  // Right side: Ribbon fold forming a forward arrow / chevron in teal-cyan gradient
  const renderIcon = () => (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        {/* Gradient for the folded arrow / right chevron */}
        <linearGradient id="proximoArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#006D77" />
          <stop offset="50%" stopColor="#00A896" />
          <stop offset="100%" stopColor="#02C39A" />
        </linearGradient>

        {/* Gradient for dark navy frame */}
        <linearGradient id="proximoNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A192F" />
          <stop offset="100%" stopColor="#0D2538" />
        </linearGradient>

        {/* Gradient for ribbon bevel highlight */}
        <linearGradient id="proximoRibbonBevel" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#028090" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
      </defs>

      {/* Left Navy Hexagonal Portal Arch */}
      <path
        d="M 52 20 
           L 18 40 
           L 18 105 
           L 36 122 
           L 36 60 
           L 52 50 
           Z"
        fill="url(#proximoNavyGrad)"
      />
      <path
        d="M 18 105 
           L 36 122 
           L 36 142 
           L 18 126 
           Z"
        fill="#040D1A"
      />

      {/* Top Roof / Header Angle connecting to chevron */}
      <path
        d="M 52 20 
           L 78 35 
           L 78 52 
           L 52 50 
           Z"
        fill="#0D3B66"
      />

      {/* 3 Users Silhouette inside the portal */}
      {/* Center user */}
      <circle cx="48" cy="80" r="7" fill="#FFFFFF" />
      <path
        d="M 39 104 C 39 94, 43 91, 48 91 C 53 91, 57 94, 57 104 Z"
        fill="#FFFFFF"
      />
      {/* Left user */}
      <circle cx="34" cy="84" r="5.5" fill="#E2E8F0" />
      <path
        d="M 26 104 C 26 96, 29 94, 34 94 C 38 94, 40 96, 40 104 Z"
        fill="#E2E8F0"
      />
      {/* Right user */}
      <circle cx="62" cy="84" r="5.5" fill="#E2E8F0" />
      <path
        d="M 56 104 C 56 96, 58 94, 62 94 C 67 94, 70 96, 70 104 Z"
        fill="#E2E8F0"
      />

      {/* Right Arrow / Forward Chevron in Teal Gradient */}
      {/* Upper fold */}
      <path
        d="M 78 35 
           L 100 48 
           L 76 68 
           L 66 58 
           Z"
        fill="url(#proximoRibbonBevel)"
      />
      {/* Arrow Head (pointing forward >) */}
      <path
        d="M 76 68 
           L 118 90 
           L 76 112 
           L 62 100 
           L 94 90 
           L 62 80 
           Z"
        fill="url(#proximoArrowGrad)"
      />
      {/* Lower fold return */}
      <path
        d="M 76 112 
           L 100 132 
           L 78 145 
           L 62 125 
           Z"
        fill="#005F73"
      />
      <path
        d="M 62 125 
           L 78 145 
           L 54 135 
           L 44 120 
           Z"
        fill="#0A9396"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon()}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {renderIcon()}

      {variant === 'full' && (
        <div className="flex flex-col select-none leading-none">
          <div className="flex items-center tracking-tight font-black font-sans">
            {/* PRÓ */}
            <span
              className={`text-xl sm:text-2xl tracking-tighter ${
                theme === 'dark'
                  ? 'text-white'
                  : theme === 'light'
                  ? 'text-[#0A192F]'
                  : 'text-white'
              }`}
              style={{ letterSpacing: '-0.03em' }}
            >
              PRÓ
            </span>

            {/* X in Vibrant Cyan/Teal Gradient */}
            <span
              className="text-xl sm:text-2xl tracking-tighter bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent px-[0.5px]"
              style={{ letterSpacing: '-0.03em' }}
            >
              X
            </span>

            {/* IMO */}
            <span
              className={`text-xl sm:text-2xl tracking-tighter ${
                theme === 'dark'
                  ? 'text-white'
                  : theme === 'light'
                  ? 'text-[#0A192F]'
                  : 'text-white'
              }`}
              style={{ letterSpacing: '-0.03em' }}
            >
              IMO
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">
            Fila Virtual Inteligente
          </span>
        </div>
      )}
    </div>
  );
};

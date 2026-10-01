import React from 'react';

interface GiroGoLogoProps {
  variant?: 'full' | 'badge' | 'stacked' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const GiroGoLogo: React.FC<GiroGoLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  theme = 'auto',
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg sm:text-xl', subtext: 'text-[8.5px]' },
    md: { icon: 38, text: 'text-2xl sm:text-3xl', subtext: 'text-[10px]' },
    lg: { icon: 50, text: 'text-3xl sm:text-4xl', subtext: 'text-[12px]' },
    xl: { icon: 68, text: 'text-5xl sm:text-6xl', subtext: 'text-[14px]' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // The Official GiroGo Rotating Speedometer Arrow Icon
  const renderIcon = (customSize?: number) => {
    const iconDim = customSize || currentSize.icon;
    return (
      <svg
        width={iconDim}
        height={iconDim}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-md select-none transition-transform hover:rotate-6 duration-300"
      >
        <defs>
          {/* Outer Ring Gradient: Vibrant Turquoise -> Emerald -> Royal Electric Blue */}
          <linearGradient id="girogoRingGradMain" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#00E5C8" />
            <stop offset="25%" stopColor="#00BFA5" />
            <stop offset="55%" stopColor="#0080FF" />
            <stop offset="85%" stopColor="#0052CC" />
            <stop offset="100%" stopColor="#0A3680" />
          </linearGradient>

          {/* Inner Dial Gradient */}
          <linearGradient id="girogoDialGradMain" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0077E6" />
            <stop offset="60%" stopColor="#00B4A0" />
            <stop offset="100%" stopColor="#00E5C8" />
          </linearGradient>

          {/* Arrow Head Bevel Highlight */}
          <linearGradient id="girogoArrowHighlightMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#55FFE2" />
            <stop offset="100%" stopColor="#00BFA5" />
          </linearGradient>

          {/* Drop shadow */}
          <filter id="girogoGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00A896" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Circular Ring Body */}
        <path
          d="M 124 28 
             C 64 30, 24 78, 24 136 
             C 24 196, 72 244, 134 244 
             C 192 244, 238 200, 240 144 
             C 240.8 136, 234 130, 226 130 
             C 218 130, 212 136, 211 143 
             C 208 184, 174 216, 133 216 
             C 87 216, 51 179, 51 134 
             C 51 90, 81 54, 126 52 
             L 122 72 
             L 174 48 
             L 132 14 
             L 124 28 
             Z"
          fill="url(#girogoRingGradMain)"
          filter="url(#girogoGlowFilter)"
        />

        {/* Arrow Head Highlight */}
        <path
          d="M 122 72 
             L 174 48 
             L 132 14 
             L 124 28 
             Z"
          fill="url(#girogoArrowHighlightMain)"
        />

        {/* Central Speedometer Dial / Pointer */}
        <path
          d="M 132 104 
             C 113 104, 98 119, 98 138 
             C 98 157, 113 172, 132 172 
             C 151 172, 166 157, 166 138 
             C 166 133, 165 128, 163 124 
             L 182 100 
             L 156 119 
             C 149 110, 141 104, 132 104 
             Z"
          fill="url(#girogoDialGradMain)"
        />

        {/* Center Hole */}
        <circle cx="132" cy="138" r="14" fill="#040D1A" />
      </svg>
    );
  };

  // Stylized 3D Ribbon Letter "G" from the GiroGo logo
  const renderRibbonG = () => (
    <span className="relative inline-block tracking-tight font-black select-none text-transparent bg-clip-text bg-gradient-to-br from-[#00E5C8] via-[#00A896] to-[#0052CC] drop-shadow-sm font-sans">
      G
    </span>
  );

  const mainTextColor =
    theme === 'dark'
      ? 'text-white'
      : theme === 'light'
      ? 'text-[#061A3D]'
      : 'text-white';

  const subTextColor =
    theme === 'light'
      ? 'text-slate-600'
      : 'text-slate-400';

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon()}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center ${className}`}>
        {renderIcon(size === 'lg' ? 64 : size === 'xl' ? 84 : 48)}
        <div className="mt-2.5 flex flex-col items-center leading-none">
          <div className={`flex items-baseline font-black font-sans tracking-tight ${currentSize.text}`}>
            {renderRibbonG()}
            <span className={mainTextColor}>iro</span>
            {renderRibbonG()}
            <span className={mainTextColor}>o</span>
          </div>
          <span className={`${currentSize.subtext} font-medium tracking-normal ${subTextColor} mt-1.5`}>
            Rodízio e Fila Virtual de Anfitriões
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {renderIcon()}
        <div className="flex items-center font-black font-sans tracking-tight leading-none select-none">
          <div className={`flex items-baseline ${currentSize.text}`}>
            {renderRibbonG()}
            <span className={mainTextColor}>iro</span>
            {renderRibbonG()}
            <span className={mainTextColor}>o</span>
          </div>
        </div>
      </div>
    );
  }

  // Default 'full' variant: Icon + GiroGo + Subtitle in clean horizontal layout
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 ${className}`}>
      {renderIcon()}

      <div className="flex flex-col select-none leading-none">
        <div className={`flex items-baseline font-black font-sans tracking-tight ${currentSize.text}`}>
          {renderRibbonG()}
          <span className={mainTextColor}>iro</span>
          {renderRibbonG()}
          <span className={mainTextColor}>o</span>
        </div>
        <span className={`${currentSize.subtext} font-medium tracking-normal ${subTextColor} mt-1`}>
          Rodízio e Fila Virtual de Anfitriões
        </span>
      </div>
    </div>
  );
};

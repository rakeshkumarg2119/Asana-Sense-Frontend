import React from 'react';

const CLOUDINARY_LOGO_URL = 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1790602123/asana_sense_logo.png';

interface AsanaSenseLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export const AsanaSenseLogo: React.FC<AsanaSenseLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'text-stone-900',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div className={`relative group/logo ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        <img 
          src={CLOUDINARY_LOGO_URL} 
          alt="Asana Sense Logo" 
          className="w-full h-full object-contain transition-transform duration-300 group-hover/logo:scale-105 drop-shadow-sm"
          loading="eager"
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-serif font-black tracking-wider ${size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg sm:text-xl'} ${textColor}`}>
              ASANA <span className="text-emerald-700 font-extrabold">- SENSE</span>
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mt-0.5">
            Yoga Biomechanics AI
          </span>
        </div>
      )}
    </div>
  );
};


import React from 'react';

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
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const badgeRadius = {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Mark with Yoga Asana Posture Vector Silhouette & Biomechanical Alignment Ring */}
      <div className="relative group/logo">
        {/* Ambient Gradient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-2xl blur-xs opacity-60 group-hover/logo:opacity-100 transition duration-300" />
        
        {/* Main Emblem Surface */}
        <div
          className={`${iconSizes[size]} ${badgeRadius[size]} relative bg-gradient-to-br from-emerald-800 via-stone-900 to-stone-950 p-1 shadow-md flex items-center justify-center overflow-hidden border border-emerald-400/40`}
        >
          {/* Concentric Biomechanics Alignment Grid */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="w-full h-full border border-dashed border-emerald-400 rounded-full animate-[spin_16s_linear_infinite]" />
          </div>

          {/* Authentic Yoga Asana Silhouette (Meditative Balancing Posture with Joint Vectors) */}
          <svg 
            className="w-full h-full text-emerald-300 relative z-10 transition-transform duration-300 group-hover/logo:scale-105" 
            viewBox="0 0 36 36" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Spine Alignment Meridian Line */}
            <line x1="18" y1="9" x2="18" y2="28" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.6" />
            
            {/* Yogi Head / Crown Chakra */}
            <circle cx="18" cy="8" r="2.8" fill="currentColor" />
            <circle cx="18" cy="8" r="1" fill="#fef08a" />
            
            {/* Torso & Core */}
            <path d="M18 10.8V21.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            
            {/* Anjali Mudra / Raised Asana Arms (Warrior / Tree Pose Overhead Arch) */}
            <path d="M11 16.5C13 13 15.5 10 18 10C20.5 10 23 13 25 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Grounded Standing Leg */}
            <path d="M18 21.5V30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            
            {/* Folded Balance Leg (Tree Pose / Vrikshasana Joint Fold) */}
            <path d="M18 22L12 25.5L18 27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Biomechanical Joint Vector Nodes */}
            <circle cx="18" cy="11" r="1" fill="#34d399" />
            <circle cx="11" cy="16.5" r="1.1" fill="#38bdf8" />
            <circle cx="25" cy="16.5" r="1.1" fill="#38bdf8" />
            <circle cx="12" cy="25.5" r="1.1" fill="#fbbf24" />
            <circle cx="18" cy="30" r="1.2" fill="#34d399" />
          </svg>
        </div>
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


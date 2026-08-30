import React from 'react';

interface PoseVisualArtworkProps {
  poseId: string;
  className?: string;
  highlightJoints?: boolean;
  viewMode?: 'skeleton' | 'image';
  imageUrl?: string;
  poseName?: string;
}

export const PoseVisualArtwork: React.FC<PoseVisualArtworkProps> = ({
  poseId,
  className = 'w-full h-full',
  highlightJoints = false,
  viewMode = 'skeleton',
  imageUrl,
  poseName = 'Yoga Pose',
}) => {
  if (viewMode === 'image' && imageUrl) {
    return (
      <div className={`relative rounded-2xl overflow-hidden shadow-md border border-stone-200 group ${className}`}>
        <img
          src={imageUrl}
          alt={poseName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white font-medium">
          <span className="bg-stone-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs font-semibold">
            Photo Visual Mode
          </span>
          <span className="text-emerald-300 font-bold">Veda AI Vision</span>
        </div>
      </div>
    );
  }
  switch (poseId) {
    case 'tree-pose':
      return (
        <svg viewBox="0 0 200 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background Ambient Glow */}
          <circle cx="100" cy="120" r="90" fill="#10B981" fillOpacity="0.08" />
          <path d="M40 220 L160 220" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Head */}
          <circle cx="100" cy="35" r="14" fill="#065F46" />
          
          {/* Spine & Torso */}
          <path d="M100 49 L100 120" stroke="#059669" strokeWidth="7" strokeLinecap="round" />
          
          {/* Anjali Mudra / Arms raised overhead */}
          <path d="M100 65 L80 40 L96 18" stroke="#10B981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M100 65 L120 40 L104 18" stroke="#10B981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Standing Leg (Rooted) */}
          <path d="M100 120 L100 220" stroke="#047857" strokeWidth="7" strokeLinecap="round" />
          
          {/* Lifted Leg placed on inner thigh */}
          <path d="M100 120 L142 145 L100 148" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          
          {highlightJoints && (
            <>
              {/* Drishti Focus Point */}
              <circle cx="100" cy="18" r="4" fill="#F59E0B" />
              {/* Pelvis Level Indicator */}
              <line x1="85" y1="120" x2="115" y2="120" stroke="#3B82F6" strokeWidth="2" strokeDasharray="2 2" />
              {/* Knee safe placement zone */}
              <circle cx="100" cy="148" r="5" fill="#10B981" />
              {/* Avoid knee joint red danger zone */}
              <circle cx="100" cy="170" r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
            </>
          )}
        </svg>
      );

    case 'warrior-2':
      return (
        <svg viewBox="0 0 240 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="120" cy="100" r="90" fill="#3B82F6" fillOpacity="0.08" />
          <path d="M30 185 L210 185" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Head looking over front fingertips */}
          <circle cx="120" cy="40" r="14" fill="#1E40AF" />
          
          {/* Torso stacked vertical */}
          <path d="M120 54 L120 115" stroke="#2563EB" strokeWidth="7" strokeLinecap="round" />
          
          {/* Arms extended horizontal */}
          <path d="M50 72 L120 70 L195 72" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" />
          
          {/* Front Leg bent at 90 deg */}
          <path d="M120 115 L175 115 L175 185" stroke="#1D4ED8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Back Leg straight & extended */}
          <path d="M120 115 L60 185" stroke="#2563EB" strokeWidth="7" strokeLinecap="round" />
          
          {highlightJoints && (
            <>
              {/* 90 deg knee angle */}
              <circle cx="175" cy="115" r="5" fill="#10B981" />
              {/* Back foot anchor */}
              <circle cx="60" cy="185" r="5" fill="#3B82F6" />
              {/* Vertical alignment line */}
              <line x1="120" y1="30" x2="120" y2="140" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
            </>
          )}
        </svg>
      );

    case 'downward-dog':
      return (
        <svg viewBox="0 0 240 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="120" cy="100" r="90" fill="#8B5CF6" fillOpacity="0.08" />
          <path d="M20 185 L220 185" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Inverted V Pelvis Apex */}
          <circle cx="120" cy="55" r="7" fill="#6D28D9" />
          
          {/* Spine & Arms to hands */}
          <path d="M120 55 L75 105 L50 185" stroke="#8B5CF6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Head aligned with upper arms */}
          <circle cx="82" cy="115" r="12" fill="#5B21B6" />
          
          {/* Legs to feet */}
          <path d="M120 55 L160 115 L190 185" stroke="#7C3AED" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          
          {highlightJoints && (
            <>
              {/* Wrist weight distribution */}
              <circle cx="50" cy="185" r="5" fill="#10B981" />
              {/* Sit bones lifting */}
              <polygon points="120,40 115,50 125,50" fill="#F59E0B" />
              {/* Spine straightness guide */}
              <line x1="120" y1="55" x2="50" y2="185" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
            </>
          )}
        </svg>
      );

    case 'cobra-pose':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="120" cy="90" r="80" fill="#EC4899" fillOpacity="0.08" />
          <path d="M20 160 L220 160" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Head & Neck (lifted gently) */}
          <circle cx="70" cy="45" r="13" fill="#BE185D" />
          
          {/* Arched Spine & Torso */}
          <path d="M70 58 Q85 110 135 155 L210 155" stroke="#DB2777" strokeWidth="7" strokeLinecap="round" />
          
          {/* Supporting Arms & Hands under shoulders */}
          <path d="M85 95 L95 125 L95 160" stroke="#F472B6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          
          {highlightJoints && (
            <>
              {/* Grounded pelvis marker */}
              <circle cx="135" cy="155" r="5" fill="#10B981" />
              {/* Gentle cervical curve */}
              <path d="M60 45 Q70 35 80 45" stroke="#F59E0B" strokeWidth="2" strokeDasharray="2 2" fill="none" />
              {/* Elbow hug inward */}
              <circle cx="95" cy="125" r="4" fill="#3B82F6" />
            </>
          )}
        </svg>
      );

    case 'triangle-pose':
      return (
        <svg viewBox="0 0 240 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="120" cy="100" r="90" fill="#F59E0B" fillOpacity="0.08" />
          <path d="M30 185 L210 185" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Triangular Legs */}
          <path d="M70 185 L125 105 L180 185" stroke="#D97706" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Angled Torso */}
          <path d="M125 105 L80 120" stroke="#B45309" strokeWidth="7" strokeLinecap="round" />
          
          {/* Head turned upward */}
          <circle cx="82" cy="105" r="13" fill="#92400E" />
          
          {/* Vertical Arms Reaching Earth & Sky */}
          <path d="M80 35 L80 120 L80 180" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
          
          {highlightJoints && (
            <>
              {/* Top hand reaching sky */}
              <circle cx="80" cy="35" r="5" fill="#10B981" />
              {/* Microbend safe knee indicator */}
              <circle cx="70" cy="150" r="4" fill="#10B981" />
              {/* Open chest line */}
              <line x1="80" y1="35" x2="80" y2="180" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
            </>
          )}
        </svg>
      );

    case 'bridge-pose':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="120" cy="90" r="80" fill="#06B6D4" fillOpacity="0.08" />
          <path d="M20 160 L220 160" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Head on floor */}
          <circle cx="45" cy="150" r="13" fill="#0E7490" />
          
          {/* Lifted Spine Arch */}
          <path d="M55 155 Q115 80 165 110" stroke="#0891B2" strokeWidth="7" strokeLinecap="round" fill="none" />
          
          {/* Grounded bent legs */}
          <path d="M165 110 L185 160" stroke="#06B6D4" strokeWidth="7" strokeLinecap="round" />
          
          {/* Grounded arms under back */}
          <path d="M60 155 L135 158" stroke="#22D3EE" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'lotus-pose':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="#8B5CF6" fillOpacity="0.08" />
          <path d="M30 175 L170 175" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Head */}
          <circle cx="100" cy="40" r="15" fill="#6D28D9" />
          
          {/* Upright Spine */}
          <path d="M100 55 L100 135" stroke="#7C3AED" strokeWidth="7" strokeLinecap="round" />
          
          {/* Crossed Lotus Legs */}
          <path d="M100 135 Q50 165 60 170 Q100 175 140 170 Q150 165 100 135" stroke="#8B5CF6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="#8B5CF6" fillOpacity="0.15" />
          
          {/* Arms resting on knees in Jnana mudra */}
          <path d="M100 75 L65 125 L55 150" stroke="#A78BFA" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M100 75 L135 125 L145 150" stroke="#A78BFA" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'childs-pose':
      return (
        <svg viewBox="0 0 240 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="120" cy="80" r="75" fill="#14B8A6" fillOpacity="0.08" />
          <path d="M20 145 L220 145" stroke="#14B8A6" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Hips resting on heels */}
          <circle cx="170" cy="120" r="10" fill="#0F766E" />
          
          {/* Curled back into surrender */}
          <path d="M170 120 Q120 70 70 125" stroke="#0D9488" strokeWidth="7" strokeLinecap="round" fill="none" />
          
          {/* Head resting on mat */}
          <circle cx="65" cy="132" r="12" fill="#115E59" />
          
          {/* Arms stretched forward flat */}
          <path d="M85 105 L40 140 L25 140" stroke="#2DD4BF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-emerald-600 bg-emerald-50 rounded-xl">
          <span className="text-sm font-semibold">ASANA-SENSE</span>
        </div>
      );
  }
};

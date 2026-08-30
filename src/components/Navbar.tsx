import React from 'react';
import { 
  User, 
  ShieldCheck, 
  Sparkles, 
  LogIn, 
  UserPlus 
} from 'lucide-react';
import { UserProfile } from '../types';
import { AsanaSenseLogo } from './AsanaSenseLogo';

interface NavbarProps {
  userProfile: UserProfile | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenProfile: () => void;
  onStartLiveSession?: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  onOpenAuth,
  onOpenProfile,
  onScrollToSection,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 transition">
      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-10 lg:px-14 h-18 flex items-center justify-between gap-6">
        {/* Brand Logo replacing old AS text */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="cursor-pointer shrink-0"
        >
          <AsanaSenseLogo size="md" />
        </div>

        {/* Desktop Navigation Links - Centered & Equally Spaced */}
        <nav className="hidden md:flex items-center justify-center flex-1 gap-8 lg:gap-12 text-xs font-semibold text-stone-600 px-6">
          <button
            onClick={() => onScrollToSection('pose-carousel-showcase')}
            className="hover:text-emerald-700 hover:bg-stone-100 transition cursor-pointer px-3 py-1.5 rounded-lg"
          >
            Pose Spectrum
          </button>
          <button
            onClick={() => onScrollToSection('features-section')}
            className="hover:text-emerald-700 hover:bg-stone-100 transition cursor-pointer px-3 py-1.5 rounded-lg"
          >
            Features & Biomechanics
          </button>
          <button
            onClick={() => onScrollToSection('privacy-assurance-promise-banner')}
            className="hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5 text-emerald-800 px-3 py-1.5 rounded-lg"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Zero-Storage Promise
          </button>
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {userProfile ? (
            <button
              id="user-profile-button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition cursor-pointer border border-stone-200 shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                {userProfile.avatarSeed}
              </div>
              <span className="max-w-[110px] truncate">{userProfile.name}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Sign In button */}
              <button
                id="header-sign-in-btn"
                onClick={() => onOpenAuth('signin')}
                className="px-3 py-1.5 rounded-xl hover:bg-stone-100 text-stone-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-stone-500" />
                Sign In
              </button>

              {/* Sign Up button */}
              <button
                id="header-sign-up-btn"
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-200" />
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

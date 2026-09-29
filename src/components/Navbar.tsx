import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Sparkles, 
  LogIn, 
  UserPlus,
  Settings,
  Radio,
  Wifi
} from 'lucide-react';
import { UserProfile } from '../types';
import { AsanaSenseLogo } from './AsanaSenseLogo';
import { getBackendUrl } from '../utils/apiClient';

interface NavbarProps {
  userProfile: UserProfile | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenProfile: () => void;
  onOpenSettings?: () => void;
  onStartLiveSession?: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  onOpenAuth,
  onOpenProfile,
  onOpenSettings,
  onScrollToSection,
}) => {
  const [isNgrokActive, setIsNgrokActive] = useState<boolean>(() => {
    const url = getBackendUrl();
    return url.includes('ngrok') || !url.includes('localhost');
  });

  useEffect(() => {
    const handleBackendChange = () => {
      const url = getBackendUrl();
      setIsNgrokActive(url.includes('ngrok') || !url.includes('localhost'));
    };

    window.addEventListener('asana_backend_changed', handleBackendChange);
    return () => window.removeEventListener('asana_backend_changed', handleBackendChange);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs transition">
      <div className="w-full max-w-[1720px] mx-auto px-3.5 sm:px-8 lg:px-14 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo */}
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

        {/* Header Right Actions: Backend Settings + Auth */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Compact Settings & Ngrok Bridge Button */}
          <button
            id="header-settings-btn"
            type="button"
            onClick={onOpenSettings}
            title="Configure Python Backend / Ngrok Bridge"
            className="relative flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-[11px] font-semibold transition cursor-pointer border border-stone-200 shadow-2xs group"
          >
            <Settings className="w-3.5 h-3.5 text-stone-600 group-hover:rotate-45 transition duration-300" />
            <span className="hidden sm:inline font-medium text-stone-700">
              {isNgrokActive ? 'Ngrok' : 'Backend'}
            </span>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isNgrokActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                isNgrokActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </span>
          </button>

          {userProfile ? (
            <button
              id="user-profile-button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition cursor-pointer border border-stone-200 shadow-2xs group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-[11px] shadow-xs shrink-0 tracking-wide">
                {userProfile.avatarSeed || userProfile.avatar_seed || (userProfile.name ? userProfile.name.trim().slice(0, 2).toUpperCase() : 'AS')}
              </div>
              <span className="max-w-[120px] truncate">{userProfile.name}</span>
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

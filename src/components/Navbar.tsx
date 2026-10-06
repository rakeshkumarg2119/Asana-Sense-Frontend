import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ShieldCheck, 
  Sparkles, 
  LogIn, 
  UserPlus,
  Settings,
  Menu,
  X,
  Layers,
  Activity,
  ChevronRight,
  Flame,
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';
import { AsanaSenseLogo } from './AsanaSenseLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { getBackendUrl, apiHealthCheck, hasConfiguredBackend } from '../utils/apiClient';

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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      if (!hasConfiguredBackend()) {
        if (isMounted) setIsBackendOnline(false);
        return;
      }
      try {
        const online = await apiHealthCheck();
        if (isMounted) setIsBackendOnline(online);
      } catch {
        if (isMounted) setIsBackendOnline(false);
      }
    };

    checkStatus();

    const handleBackendChange = () => {
      checkStatus();
    };

    window.addEventListener('asana_backend_changed', handleBackendChange);
    return () => {
      isMounted = false;
      window.removeEventListener('asana_backend_changed', handleBackendChange);
    };
  }, []);

  // Close drawer on Escape key and handle body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };

    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileDrawerOpen]);

  const handleMobileNavClick = (sectionId: string) => {
    setMobileDrawerOpen(false);
    // Slight timeout allows drawer to close smoothly before scrolling
    setTimeout(() => {
      onScrollToSection(sectionId);
    }, 150);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs transition" role="banner">
        {/* Skip to Content for Keyboard Users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-900 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-xs transition"
        >
          Skip to main content (Press Enter)
        </a>

        <div className="w-full max-w-[1720px] mx-auto px-3.5 sm:px-8 lg:px-14 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo */}
          <button 
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="cursor-pointer shrink-0 rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 text-left"
            aria-label="ASANA - SENSE Home, scroll to top"
          >
            <AsanaSenseLogo size="md" />
          </button>

          {/* Desktop Navigation Links - Centered (Hidden on mobile) */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-8 lg:gap-12 text-xs font-semibold text-stone-600 px-6" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => onScrollToSection('pose-carousel-showcase')}
              className="hover:text-emerald-700 hover:bg-stone-100 transition cursor-pointer px-3 py-1.5 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Pose Spectrum
            </button>
            <button
              type="button"
              onClick={() => onScrollToSection('features-section')}
              className="hover:text-emerald-700 hover:bg-stone-100 transition cursor-pointer px-3 py-1.5 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Features & Biomechanics
            </button>
            <button
              type="button"
              onClick={() => onScrollToSection('privacy-assurance-promise-banner')}
              className="hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5 text-emerald-800 px-3 py-1.5 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              Zero-Storage Promise
            </button>
          </nav>

          {/* Desktop Header Right Actions: PWA Install + Backend Settings + Auth (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop In-App PWA Install Trigger */}
            <PWAInstallButton />

            {/* Desktop Settings Button */}
            <button
              id="header-settings-btn"
              type="button"
              onClick={onOpenSettings}
              title="Settings"
              aria-label="Settings"
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-[11px] font-semibold transition cursor-pointer border border-stone-200 shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Settings className="w-3.5 h-3.5 text-stone-600 group-hover:rotate-45 transition duration-300" aria-hidden="true" />
              <span className="font-medium text-stone-700">
                Settings
              </span>
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isBackendOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </span>
            </button>

            {userProfile ? (
              <button
                id="user-profile-button"
                type="button"
                onClick={onOpenProfile}
                aria-label={`Open profile for ${userProfile.name || 'User'}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition cursor-pointer border border-stone-200 shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-[11px] shadow-xs shrink-0 tracking-wide" aria-hidden="true">
                  {userProfile.avatarSeed || userProfile.avatar_seed || (userProfile.name ? userProfile.name.trim().slice(0, 2).toUpperCase() : 'AS')}
                </div>
                <span className="max-w-[120px] truncate">{userProfile.name}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Sign In button */}
                <button
                  id="header-sign-in-btn"
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="px-3 py-1.5 rounded-xl hover:bg-stone-100 text-stone-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
                  Sign In
                </button>

                {/* Sign Up button */}
                <button
                  id="header-sign-up-btn"
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-200" aria-hidden="true" />
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Profile Avatar (if logged in) + Hamburger Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {userProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label={`Open profile for ${userProfile.name || 'User'}`}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {userProfile.avatarSeed || userProfile.avatar_seed || (userProfile.name ? userProfile.name.trim().slice(0, 2).toUpperCase() : 'AS')}
              </button>
            )}

            <button
              id="mobile-hamburger-btn"
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open mobile navigation menu"
              aria-expanded={mobileDrawerOpen}
              className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 transition flex items-center justify-center cursor-pointer border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Menu className="w-5 h-5 text-stone-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Side Drawer for Mobile (< md screens) */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Slide-Out Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-[85%] max-w-sm h-full bg-white shadow-2xl flex flex-col z-50 border-l border-stone-200"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Drawer"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/70">
                <AsanaSenseLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close mobile menu"
                  className="w-9 h-9 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-600 hover:text-stone-900 transition flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Navigation Links Group */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 block mb-2">
                    Navigation Spectrum
                  </span>

                  <button
                    type="button"
                    onClick={() => handleMobileNavClick('pose-carousel-showcase')}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 font-semibold text-sm transition text-left cursor-pointer border border-stone-100"
                  >
                    <span className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Pose Spectrum</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMobileNavClick('features-section')}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 font-semibold text-sm transition text-left cursor-pointer border border-stone-100"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Features & Biomechanics</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMobileNavClick('privacy-assurance-promise-banner')}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 font-semibold text-sm transition text-left cursor-pointer border border-emerald-100"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Zero-Storage Promise</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>

                {/* Settings Card */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 block mb-2">
                    Preferences
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenSettings?.();
                    }}
                    className="w-full p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span>Settings</span>
                          <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              isBackendOnline ? 'bg-emerald-400' : 'bg-amber-400'
                            }`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                              isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">Configure Backend & Preferences</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </button>
                </div>

                {/* Account / Authentication Section */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 block mb-2">
                    Account & Sanctuary
                  </span>

                  {userProfile ? (
                    <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {userProfile.avatarSeed || userProfile.avatar_seed || (userProfile.name ? userProfile.name.trim().slice(0, 2).toUpperCase() : 'AS')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-stone-900 truncate">{userProfile.name}</p>
                          <p className="text-xs text-stone-500 truncate">{userProfile.email}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>View Profile & Analytics</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        id="mobile-drawer-sign-in"
                        type="button"
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onOpenAuth('signin');
                        }}
                        className="w-full py-3 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
                      >
                        <LogIn className="w-3.5 h-3.5 text-stone-600" />
                        <span>Sign In</span>
                      </button>

                      <button
                        id="mobile-drawer-sign-up"
                        type="button"
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onOpenAuth('signup');
                        }}
                        className="w-full py-3 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Sign Up</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Notice */}
              <div className="p-4 border-t border-stone-200 bg-stone-50/90 text-center">
                <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Private In-Memory Posture AI</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

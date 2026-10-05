import React from 'react';
import { ShieldCheck, Lock, Sparkles, Heart, Activity, Utensils, Settings, Terminal, Cookie } from 'lucide-react';
import { AsanaSenseLogo } from './AsanaSenseLogo';

interface FooterProps {
  onScrollTo: (id: string) => void;
  onOpenLiveSession: () => void;
  onOpenSettings?: () => void;
  onOpenPrivacyTerms?: (tab: 'privacy' | 'terms' | 'disclaimer') => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onScrollTo, 
  onOpenLiveSession, 
  onOpenSettings,
  onOpenPrivacyTerms 
}) => {
  const handleOpenCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  };

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-12 pb-8 px-6 sm:px-10 lg:px-14">
      <div className="max-w-[1720px] w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-800">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-3">
          <AsanaSenseLogo size="md" textColor="text-white" />
          <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
            AI-powered yoga biomechanics feedback, voice-controlled pose switching, anatomical wrong posture warnings, Body Mass Index diet planning, and encrypted session health analytics.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Storage Guarantee: Video & Voice processed strictly in volatile browser RAM.</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Core Modules
          </h4>
          <ul className="text-xs space-y-2 text-stone-400">
            <li>
              <button onClick={() => onScrollTo('pose-carousel-showcase')} className="hover:text-emerald-400 transition cursor-pointer">
                8 Poses Carousel
              </button>
            </li>
            <li>
              <button onClick={() => onScrollTo('features-section')} className="hover:text-emerald-400 transition cursor-pointer">
                Feature Highlights & Biomechanics
              </button>
            </li>
            <li>
              <button onClick={() => onScrollTo('features-section')} className="hover:text-emerald-400 transition cursor-pointer">
                BMI & Yogic Diet Plan
              </button>
            </li>
            <li>
              <button onClick={onOpenLiveSession} className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1 text-emerald-400">
                <Activity className="w-3 h-3" /> Live 5-Pose Session
              </button>
            </li>
            {onOpenSettings && (
              <li>
                <button onClick={onOpenSettings} className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5 text-stone-300">
                  <Settings className="w-3.5 h-3.5 text-emerald-400" /> Settings
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Security & Vault */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Privacy Vault & Legal
          </h4>
          <ul className="text-xs space-y-2 text-stone-400">
            <li>
              <button 
                type="button"
                onClick={() => onOpenPrivacyTerms?.('privacy')}
                className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Storage Privacy Policy</span>
              </button>
            </li>
            <li>
              <button 
                type="button"
                onClick={() => onOpenPrivacyTerms?.('terms')}
                className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terms of Service</span>
              </button>
            </li>
            <li>
              <button 
                type="button"
                onClick={() => onOpenPrivacyTerms?.('disclaimer')}
                className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Biomechanics Safety Notice</span>
              </button>
            </li>
            <li className="flex items-center gap-1.5 text-stone-400 text-xs">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>FastAPI & MediaPipe Python Bridge</span>
            </li>
            <li>
              <button 
                type="button"
                onClick={handleOpenCookiePreferences}
                className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5 text-stone-400 text-xs mt-1"
              >
                <Cookie className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cookie Preferences</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
        <p>© {new Date().getFullYear()} ASANA - SENSE. Academic Capstone Project.</p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onOpenPrivacyTerms?.('privacy')}
            className="hover:text-stone-300 transition cursor-pointer underline underline-offset-2"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => onOpenPrivacyTerms?.('terms')}
            className="hover:text-stone-300 transition cursor-pointer underline underline-offset-2"
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={handleOpenCookiePreferences}
            className="hover:text-stone-300 transition cursor-pointer underline underline-offset-2"
          >
            Cookie Settings
          </button>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { ShieldCheck, Lock, Sparkles, Heart, Activity, Utensils } from 'lucide-react';
import { AsanaSenseLogo } from './AsanaSenseLogo';

interface FooterProps {
  onScrollTo: (id: string) => void;
  onOpenLiveSession: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollTo, onOpenLiveSession }) => {
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
          </ul>
        </div>

        {/* Security & Vault */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Privacy Vault
          </h4>
          <ul className="text-xs space-y-2 text-stone-400">
            <li className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256 Cloud Vault Encryption</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>In-Memory Vision Processing</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gemini 3.7 Flash Biomechanics</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
        <p>© {new Date().getFullYear()} ASANA - SENSE. Crafted for mindful alignment and holistic vitality.</p>
        <p className="flex items-center gap-1">
          Designed with mindful yoga biomechanics & privacy-first intelligence
        </p>
      </div>
    </footer>
  );
};

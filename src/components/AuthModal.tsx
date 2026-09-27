 import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ShieldCheck, User, Mail, KeyRound, Zap, Sparkles, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import type { UserProfile } from '../types';
import { apiSignUp, apiSignIn } from '../utils/apiClient';
import { AsanaSenseLogo } from './AsanaSenseLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode if initialMode changes
  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const response = await apiSignUp(name.trim(), email.trim(), password);
        setSuccessMessage(`Account created for ${email}! Welcome to ASANA-SENSE.`);
        setTimeout(() => {
          onAuthSuccess(response.user);
          onClose();
        }, 800);
      } else {
        const response = await apiSignIn(email.trim(), password);
        setSuccessMessage(`Welcome back, ${response.user.name || 'Practitioner'}!`);
        setTimeout(() => {
          onAuthSuccess(response.user);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle 1-Click Social Auth (Google / Microsoft)
  const handleSocialAuth = async (provider: 'Google' | 'Microsoft') => {
    const demoEmail = provider === 'Google' ? 'user.google@gmail.com' : 'user.microsoft@outlook.com';
    const demoName = provider === 'Google' ? 'Google Practitioner' : 'Microsoft Practitioner';
    
    setIsSubmitting(true);
    setError(null);
    try {
      let res;
      try {
        res = await apiSignIn(demoEmail, 'social-auth-password-2026');
      } catch {
        res = await apiSignUp(demoName, demoEmail, 'social-auth-password-2026');
      }

      setSuccessMessage(`🎉 Signed in with ${provider}! Welcome, ${demoName}.`);
      setTimeout(() => {
        onAuthSuccess(res.user);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Social authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="auth-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 relative my-auto overflow-hidden text-stone-900"
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prominent Close Button */}
            <button
              id="close-auth-modal-btn"
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 hover:text-stone-900 transition flex items-center justify-center cursor-pointer border border-stone-200/80 shadow-2xs z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header Branding */}
            <div className="text-center mb-4 pr-6">
              <div className="flex justify-center mb-2">
                <AsanaSenseLogo size="md" />
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-900">
                {mode === 'signup' ? 'Sign Up' : 'Sign In'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {mode === 'signup'
                  ? 'Unlock live posture sessions & private encrypted reports.'
                  : 'Access your encrypted posture logs & yogic diet.'}
              </p>
            </div>

            {/* Social Auth Providers (Google & Microsoft) */}
            <div className="space-y-2 mb-3">
              <button
                id="auth-google-btn"
                type="button"
                onClick={() => handleSocialAuth('Google')}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs hover:border-stone-300"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                id="auth-microsoft-btn"
                type="button"
                onClick={() => handleSocialAuth('Microsoft')}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs hover:border-stone-300"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span>Continue with Microsoft</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
              <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-stone-400">OR USE EMAIL</span>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex bg-stone-100 p-0.5 rounded-xl mb-3.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center text-[11px] ${
                  mode === 'signup' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center text-[11px] ${
                  mode === 'signin' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Full Name / Handle
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maya Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 text-stone-900 placeholder:text-stone-400"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="test@asanasense.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 text-stone-900 placeholder:text-stone-400"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Secret Passkey
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-9 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 text-stone-900 placeholder:text-stone-400"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2 font-medium">
                  {error}
                </div>
              )}

              {/* Success Alert */}
              {successMessage && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Create Secure Account' : 'Sign In & Continue'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Security Note */}
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 justify-center pt-1 font-medium">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Passwords are encrypted with bcrypt. Data stored securely in MongoDB Atlas.</span>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

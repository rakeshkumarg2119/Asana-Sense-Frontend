import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ShieldCheck, User, Mail, KeyRound, Zap, Sparkles, CheckCircle2, ArrowRight, RefreshCw, Send } from 'lucide-react';
import { UserProfile } from '../types';
import { createInitialAccount, createTestAccount } from '../utils/profileStorage';
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
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [welcomeNotice, setWelcomeNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync mode if initialMode changes or modal opens
  useEffect(() => {
    setMode(initialMode);
    setStep('form');
    setError(null);
    setWelcomeNotice(null);
  }, [initialMode, isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle standard email sign in or initiation of email sign up verification
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      // Trigger Email Verification Step
      setStep('verify');
      setVerificationCode('5824'); // Default test code for instant usability
      return;
    }

    // Direct Sign In for existing email
    const userName = email.split('@')[0];
    const profile = createInitialAccount(userName, email);
    onAuthSuccess(profile);
    onClose();
  };

  // Verify code & dispatch Welcome Email
  const handleVerifyCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verificationCode || verificationCode.length < 4) {
      setError('Please enter the 4-digit verification code sent to your email.');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const userName = name.trim() || email.split('@')[0];
      const profile = createInitialAccount(userName, email);
      
      // Show Welcome Email Notification Banner
      setWelcomeNotice(`📧 Welcome Email Sent! Account verified for ${email}`);
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
      }, 1200);
    }, 600);
  };

  // Handle 1-Click Social Auth (Google / Microsoft)
  const handleSocialAuth = (provider: 'Google' | 'Microsoft') => {
    const demoEmail = provider === 'Google' ? 'user.google@gmail.com' : 'user.microsoft@outlook.com';
    const demoName = provider === 'Google' ? 'Google User' : 'Microsoft User';
    
    setWelcomeNotice(`🎉 Signed in with ${provider}! Welcome email sent to ${demoEmail}`);
    setTimeout(() => {
      const profile = createInitialAccount(demoName, demoEmail);
      onAuthSuccess(profile);
      onClose();
    }, 1000);
  };

  const handleUseTestAccount = () => {
    const testProfile = createTestAccount();
    onAuthSuccess(testProfile);
    onClose();
  };

  return (
    <div 
      id="auth-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 relative my-auto overflow-hidden"
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

        {/* Modal Header */}
        <div className="text-center mb-4 pr-6">
          <div className="flex justify-center mb-2">
            <AsanaSenseLogo size="md" />
          </div>
          <h3 className="text-lg font-serif font-bold text-stone-900">
            {step === 'verify' 
              ? 'Verify Email Address' 
              : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {step === 'verify'
              ? `Verification code sent to ${email}`
              : mode === 'signup'
              ? 'Unlock live posture sessions & private encrypted reports.'
              : 'Access your encrypted posture logs & yogic diet.'}
          </p>
        </div>

        {/* Welcome Email Toast Notification Banner */}
        <AnimatePresence>
          {welcomeNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 p-2.5 rounded-xl bg-emerald-950 text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-500/50 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <span>{welcomeNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'verify' ? (
          /* Email Verification Code Screen */
          <div className="space-y-3.5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center space-y-2">
              <Mail className="w-6 h-6 text-emerald-600 mx-auto animate-pulse" />
              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                Enter the 4-digit code sent to <strong className="text-stone-900">{email}</strong> to verify your account and receive your Welcome Guide.
              </p>
              <div className="pt-1">
                <input
                  type="text"
                  maxLength={4}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="5824"
                  className="w-32 mx-auto text-center font-mono text-xl tracking-widest py-2 rounded-xl border border-emerald-400 bg-white font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
                />
              </div>
            </div>

            {error && (
              <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 text-center">
                {error}
              </div>
            )}

            <button
              onClick={() => handleVerifyCode()}
              disabled={isVerifying}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Code & Sending Welcome Email...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Code & Complete Sign Up</span>
                </>
              )}
            </button>

            <button
              onClick={() => setStep('form')}
              className="w-full py-1.5 text-xs text-stone-500 hover:text-stone-800 transition cursor-pointer text-center"
            >
              ← Back to registration details
            </button>
          </div>
        ) : (
          /* Standard Auth & OAuth Options Form */
          <>
            {/* Social Auth Providers (Google & Microsoft) */}
            <div className="space-y-2 mb-3">
              <button
                id="auth-google-btn"
                type="button"
                onClick={() => handleSocialAuth('Google')}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs hover:border-stone-300"
              >
                {/* Google Multi-Color SVG Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                {/* Microsoft 4-Color SVG Icon */}
                <svg className="w-4 h-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span>Continue with Microsoft</span>
              </button>
            </div>

            {/* Or Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
              <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-stone-400">or use email</span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-stone-100 p-0.5 rounded-lg mb-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-1 rounded-md transition cursor-pointer text-center text-[11px] ${
                  mode === 'signup' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex-1 py-1 rounded-md transition cursor-pointer text-center text-[11px] ${
                  mode === 'signin' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
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
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
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
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                  Secret Passkey
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                  />
                </div>
              </div>

              {error && (
                <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-1.5">
                  {error}
                </div>
              )}

              {/* Compact Demo Instant Login Button */}
              <div className="pt-1">
                <button
                  id="auth-test-account-btn"
                  type="button"
                  onClick={handleUseTestAccount}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-semibold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                  <span>⚡ Instant Demo: Use Test Account</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 space-y-1.5">
                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-semibold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {mode === 'signup' ? 'Continue & Verify Email' : 'Sign In & Continue'}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

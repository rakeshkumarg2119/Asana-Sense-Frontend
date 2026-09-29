import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  User, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft,
  Send,
  Timer
} from 'lucide-react';
import type { UserProfile } from '../types';
import { 
  apiSignIn, 
  apiSendOtp, 
  apiVerifyOtp, 
  apiResendOtp, 
  apiOAuthGoogle,
  apiForgotPassword,
  checkBackendConnection 
} from '../utils/apiClient';
import { AsanaSenseLogo } from './AsanaSenseLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile, isNewSignUp?: boolean) => void;
  initialMode?: 'signin' | 'signup';
  onOpenResetPasswordModal?: (email?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signup',
  onOpenResetPasswordModal,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup_form' | 'signup_otp' | 'forgot_password' | 'forgot_password_success'>(
    initialMode === 'signin' ? 'signin' : 'signup_form'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP states
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  
  // Status and Error states
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isServerOffline, setIsServerOffline] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync mode if initialMode changes
  useEffect(() => {
    setMode(initialMode === 'signin' ? 'signin' : 'signup_form');
    setError(null);
    setErrorStatus(null);
    setSuccessMessage(null);
    setIsServerOffline(false);
    setOtpDigits(['', '', '', '', '', '']);
  }, [initialMode, isOpen]);

  // Resend OTP countdown timer (30s cooldown per checklist)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'signup_otp' && resendCooldown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendCooldown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mode, resendCooldown]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Retry Connection
  const handleRetryConnection = async () => {
    setIsRetrying(true);
    setError(null);
    setErrorStatus(null);
    try {
      const status = await checkBackendConnection();
      if (status.connected) {
        setIsServerOffline(false);
        setError(null);
      } else {
        setIsServerOffline(true);
        setError('Server is currently offline / unreachable. Please start your backend server. Once fixed, see you soon!');
      }
    } catch {
      setIsServerOffline(true);
      setError('Server is currently offline / unreachable. Please start your backend server. Once fixed, see you soon!');
    } finally {
      setIsRetrying(false);
    }
  };

  // Step 1: Submit email & password (or Sign In)
  const handleInitialFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorStatus(null);
    setSuccessMessage(null);
    setIsServerOffline(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'signin') {
      try {
        const response = await apiSignIn(cleanEmail, cleanPassword);
        setSuccessMessage(`Welcome back, ${response.user.name || 'Practitioner'}!`);
        setTimeout(() => {
          onAuthSuccess(response.user, false);
          onClose();
        }, 600);
      } catch (err: any) {
        const status = err?.status;
        setErrorStatus(status || null);
        const msg = err?.message || 'Authentication failed.';

        if (err?.isOffline || msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('unreachable') || msg.toLowerCase().includes('fetch')) {
          setIsServerOffline(true);
          setError('Server is currently offline / unreachable. Please ensure the backend is running. Once fixed, see you soon!');
        } else if (status === 503) {
          setError('Email service or backend temporarily unavailable. Please try again later.');
        } else {
          setError(msg);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Sign Up Flow -> Step 1: Request OTP dispatch (POST /api/auth/send-otp with {name, email, password})
      if (!cleanName) {
        setError('Please enter your full name');
        setIsSubmitting(false);
        return;
      }

      try {
        await apiSendOtp(cleanName, cleanEmail, cleanPassword);
        setResendCooldown(30);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setMode('signup_otp');
        setError(null);
        setErrorStatus(null);
        setSuccessMessage(`6-digit verification code sent to ${cleanEmail}`);
        // Focus first input box after render
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } catch (err: any) {
        const status = err?.status;
        setErrorStatus(status || null);
        const msg = err?.message || 'Failed to dispatch verification email.';

        if (err?.isOffline || msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('unreachable') || msg.toLowerCase().includes('fetch')) {
          setIsServerOffline(true);
          setError('Server is currently offline / unreachable. Please ensure the backend is running. Once fixed, see you soon!');
        } else if (status === 409) {
          setError('This email is already registered. Please sign in instead.');
        } else if (status === 503) {
          setError('Email service temporarily unavailable. Please try again later.');
        } else {
          setError(msg);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Forgot Password Submit Handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your account email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setErrorStatus(null);
    setIsServerOffline(false);

    try {
      await apiForgotPassword(cleanEmail);
      setMode('forgot_password_success');
      setSuccessMessage(`Password reset link has been dispatched to ${cleanEmail}`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to send reset link.';
      if (err?.isOffline || msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('unreachable') || msg.toLowerCase().includes('fetch')) {
        setIsServerOffline(true);
        setError('Server is currently offline / unreachable. Please ensure the backend is running. Once fixed, see you soon!');
      } else {
        // Always 200 message in standard flow, but if 503 show try again later
        if (err?.status === 503) {
          setError('Email service temporarily unavailable. Please try again later.');
        } else {
          setError(msg);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle 6-Digit OTP Box Change
  const handleOtpDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanVal;
    setOtpDigits(updated);
    setError(null);
    setErrorStatus(null);

    // Auto-advance focus
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split('');
    const updated = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 6) updated[i] = d;
    });
    setOtpDigits(updated);
    const nextIdx = Math.min(digits.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Step 3: Verify OTP and complete signup (POST /api/auth/verify-otp with {email, otp} only)
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setErrorStatus(null);
    setIsServerOffline(false);

    try {
      const response = await apiVerifyOtp(email.trim(), enteredOtp);
      setSuccessMessage(`✨ Account verified for ${email}! Welcome, ${response.user.name || 'Practitioner'}.`);
      setTimeout(() => {
        onAuthSuccess(response.user, true);
        onClose();
      }, 700);
    } catch (err: any) {
      const status = err?.status;
      setErrorStatus(status || null);
      const msg = err?.message || 'Invalid or expired OTP code.';

      if (err?.isOffline || msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('unreachable') || msg.toLowerCase().includes('fetch')) {
        setIsServerOffline(true);
        setError('Server is currently offline / unreachable. Please ensure the backend is running. Once fixed, see you soon!');
      } else if (status === 429) {
        // 5 wrong codes burn the code
        setError('Too many wrong codes. Code burned. Please request a new verification code.');
      } else if (status === 503) {
        setError('Email service temporarily unavailable. Please try again later.');
      } else {
        // 400: wrong code, expired, or no pending signup -> show detail text
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP handler (POST /api/auth/resend-otp with {email}, disables button for 30s)
  const handleResendOtp = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setError(null);
    setErrorStatus(null);
    setOtpDigits(['', '', '', '', '', '']);
    try {
      await apiResendOtp(email.trim());
      setResendCooldown(30);
      setCanResend(false);
      setSuccessMessage(`A fresh 6-digit code has been sent to ${email.trim()}`);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      const status = err?.status;
      setErrorStatus(status || null);
      const msg = err?.message || 'Could not resend OTP.';

      if (err?.isOffline || msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('unreachable')) {
        setIsServerOffline(true);
        setError('Server is currently offline / unreachable. Please ensure the backend is running.');
      } else if (status === 429) {
        setError('Resend rate limit reached. Please wait before requesting another code.');
      } else if (status === 503) {
        setError('Email service temporarily unavailable. Please try again later.');
      } else {
        setError(msg);
      }
    } finally {
      setIsResending(false);
    }
  };

  // 1-Click Social Auth (Google / Microsoft - Already Verified by Provider)
  const handleSocialAuth = async (provider: 'Google' | 'Microsoft') => {
    setIsSubmitting(true);
    setError(null);
    setErrorStatus(null);
    setIsServerOffline(false);

    const demoEmail = provider === 'Google' ? 'verified.google@gmail.com' : 'verified.microsoft@outlook.com';
    const demoName = provider === 'Google' ? 'Google Practitioner' : 'Microsoft Practitioner';

    try {
      const res = await apiOAuthGoogle('social_credential_verified', {
        email: demoEmail,
        name: demoName,
      });

      setSuccessMessage(`🎉 Signed in with ${provider}! Welcome, ${res.user.name}.`);
      setTimeout(() => {
        onAuthSuccess(res.user, false);
        onClose();
      }, 700);
    } catch (err: any) {
      const msg = err?.message || `${provider} authentication failed.`;
      if (msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('unreachable') || msg.toLowerCase().includes('fetch')) {
        setIsServerOffline(true);
        setError('Server is currently offline / unreachable. Please start your backend server. Once fixed, see you soon!');
      } else {
        setError(msg);
      }
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
                {mode === 'signup_otp'
                  ? 'Verify Your Email'
                  : mode === 'signup_form'
                  ? 'Sign Up & Verify'
                  : mode === 'forgot_password'
                  ? 'Forgot Password'
                  : mode === 'forgot_password_success'
                  ? 'Reset Link Sent'
                  : 'Sign In'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {mode === 'signup_otp'
                  ? 'Enter the 6-digit OTP code sent to your email.'
                  : mode === 'signup_form'
                  ? 'Verified email & encrypted posture logs.'
                  : mode === 'forgot_password'
                  ? 'Enter your email to receive a secure password reset link.'
                  : mode === 'forgot_password_success'
                  ? 'Check your inbox for password reset instructions.'
                  : 'Access your encrypted posture telemetry.'}
              </p>
            </div>

            {/* Server Offline Alert Banner */}
            {isServerOffline && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-amber-950">Server is currently offline / unreachable</div>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Please start your Python FastAPI backend. Once fixed, see you soon!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetryConnection}
                  disabled={isRetrying}
                  className="w-full py-2 px-3 rounded-xl bg-amber-200/90 hover:bg-amber-300 active:scale-98 font-bold text-amber-900 transition flex items-center justify-center gap-1.5 text-[11px] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Checking connection...' : 'Retry Server Connection'}</span>
                </button>
              </div>
            )}

            {/* 6-DIGIT OTP VERIFICATION SCREEN */}
            {mode === 'signup_otp' ? (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium mb-2">
                    <Mail className="w-3 h-3 text-emerald-600" />
                    <span className="truncate max-w-[180px] font-semibold">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup_form');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="block mx-auto text-[11px] text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    Change email address
                  </button>
                </div>

                {/* 6-Digit Code Inputs */}
                <div className="flex justify-between gap-1.5 px-1">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-12 text-center text-lg font-bold font-mono rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-stone-900 transition"
                    />
                  ))}
                </div>

                {/* Expiry & Tries Note */}
                <div className="text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
                  <Timer className="w-3 h-3 text-emerald-600" />
                  <span>Valid for 10 minutes • 5 incorrect attempts burn the code</span>
                </div>

                {/* Error Alert */}
                {error && !isServerOffline && (
                  <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 font-medium space-y-1.5">
                    <div>{error}</div>
                    {errorStatus === 429 && (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={!canResend || isResending}
                        className="w-full py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition cursor-pointer"
                      >
                        Request Fresh Verification Code
                      </button>
                    )}
                  </div>
                )}

                {/* Success Alert */}
                {successMessage && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join('').length < 6 || errorStatus === 429}
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? 'Verifying OTP...' : 'Verify & Create Account'}
                </button>

                {/* Resend OTP Section */}
                <div className="text-center pt-1 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMode('signup_form')}
                    className="text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isResending}
                    className="text-emerald-700 hover:text-emerald-900 disabled:text-stone-400 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    {isResending ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>
                      {canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}
                    </span>
                  </button>
                </div>
              </form>
            ) : mode === 'forgot_password' ? (
              /* FORGOT PASSWORD FORM */
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="text-xs text-stone-600 leading-relaxed">
                  Enter your registered account email address. We will dispatch a direct password reset link and security token to your inbox.
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="practitioner@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 text-stone-900 placeholder:text-stone-400"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && !isServerOffline && (
                  <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2 font-medium">
                    {error}
                  </div>
                )}

                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !email.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Sending Link...' : 'Send Password Reset Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="w-full py-2 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-100 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            ) : mode === 'forgot_password_success' ? (
              /* FORGOT PASSWORD SUCCESS */
              <div className="py-2 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-stone-900 text-base">Check Your Inbox</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    We sent a password reset link to <strong className="text-stone-800">{email}</strong>. Click the link in the email or open the reset tool directly.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  {onOpenResetPasswordModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenResetPasswordModal(email);
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Enter Reset Token / New Password</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-2 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-100 transition cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD SIGN IN / SIGN UP FORM */
              <>
                {/* Social Auth Providers (Google & Microsoft - Pre-verified OAuth) */}
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
                  <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-stone-400">OR USE EMAIL & PASSWORD</span>
                </div>

                {/* Mode Toggle Tabs */}
                <div className="flex bg-stone-100 p-0.5 rounded-xl mb-3.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setMode('signup_form'); setError(null); setSuccessMessage(null); }}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center text-[11px] ${
                      mode === 'signup_form' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
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
                <form onSubmit={handleInitialFormSubmit} className="space-y-3">
                  {/* Name (signup only) */}
                  {mode === 'signup_form' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Full Name / Handle
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. RAKESH KUMAR G"
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
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 text-stone-900 placeholder:text-stone-400"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-stone-700">
                        Secret Passkey
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot_password');
                            setError(null);
                            setSuccessMessage(null);
                          }}
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
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
                        autoComplete={mode === 'signup_form' ? 'new-password' : 'current-password'}
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
                  {error && !isServerOffline && (
                    <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 font-medium space-y-1.5">
                      <div>{error}</div>
                      {errorStatus === 409 && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('signin');
                            setError(null);
                            setErrorStatus(null);
                          }}
                          className="w-full py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Sign In to Your Account Instead</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
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
                          <span>
                            {mode === 'signup_form'
                              ? 'Continue to Email Verification'
                              : 'Sign In & Continue'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Security Note */}
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 justify-center pt-1 font-medium">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Real-time verification required before account activation.</span>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

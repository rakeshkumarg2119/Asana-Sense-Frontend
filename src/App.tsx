/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PoseCarousel } from './components/PoseCarousel';
import { FeatureColumns } from './components/FeatureColumns';
import { LivePostureSession } from './components/LivePostureSession';
import { SessionReportModal } from './components/SessionReportModal';
import { PoseDetailModal } from './components/PoseDetailModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PreSessionOnboardingModal } from './components/PreSessionOnboardingModal';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { AppLoading } from './components/AppLoading';
import { SessionLoadingTransition } from './components/SessionLoadingTransition';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { NotFoundPage } from './components/NotFoundPage';
import { WelcomeToast } from './components/WelcomeToast';
import { Info, X, WifiOff, Server, AlertTriangle, RefreshCw, Settings as SettingsIcon, Sparkles, Mail, CheckCircle2 } from 'lucide-react';
import type { UserProfile, YogaPose, PracticeSession } from './types';
import { getStoredUserProfile, saveUserProfile, saveSessionRecord, fetchUserProfileFromAPI } from './utils/profileStorage';
import { getToken, apiLogout, apiHealthCheck, getBackendUrl, setBackendUrl, checkBackendConnection, apiSendSessionEmail } from './utils/apiClient';
import { fetchPosesFromAPI, ALL_POSES } from './data/yogaPoses';
import { soundEngine } from './utils/audioFeedback';
import { isMobileDevice } from './utils/deviceDetection';
import { MobileDesktopNoticeModal } from './components/MobileDesktopNoticeModal';
import { getSessionRotationOffset, incrementSessionRotationOffset } from './utils/poseRecommendations';

export default function App() {
  // 404 Route state
  const [isNotFound, setIsNotFound] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().trim();
      const validExact = ['/', '', '/index.html', '/reset-password', '/reset_password', '/auth/reset-password', '/session', '/home'];
      if (validExact.includes(path) || path.startsWith('/reset-password') || path.startsWith('/auth') || path.startsWith('/?')) {
        return false;
      }
      return true;
    }
    return false;
  });

  // User profile & auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Dynamic Pose Rotation Offset (shifts pose displays forward after exiting sessions, for both guests and accounts)
  const [poseRotationOffset, setPoseRotationOffset] = useState<number>(() => getSessionRotationOffset());

  // Listen to external rotation updates
  useEffect(() => {
    const handleRotationChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ offset: number }>;
      if (customEvent.detail && typeof customEvent.detail.offset === 'number') {
        setPoseRotationOffset(customEvent.detail.offset);
      } else {
        setPoseRotationOffset(getSessionRotationOffset());
      }
    };
    window.addEventListener('asana_pose_rotation_changed', handleRotationChanged);
    return () => window.removeEventListener('asana_pose_rotation_changed', handleRotationChanged);
  }, []);

  // Welcome new signup toast
  const [welcomeToast, setWelcomeToast] = useState<{ name: string; email: string } | null>(null);

  // Empty session notice toast
  const [emptySessionNotice, setEmptySessionNotice] = useState<string | null>(null);

  // Precautionary health & dietary advisory banner state
  const [homeAdvisoryDismissed, setHomeAdvisoryDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('asana_dietary_advisory_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Backend offline modal state & background auto-recovery polling
  // Backend offline modal state & background auto-recovery polling
  const [serverDownModalOpen, setServerDownModalOpen] = useState(false);
  const [isRetryingConnection, setIsRetryingConnection] = useState(false);
  const [pendingPoseAfterCheck, setPendingPoseAfterCheck] = useState<string | undefined>(undefined);
  const [autoPollAttempts, setAutoPollAttempts] = useState(0);
  const [coldStartSeconds, setColdStartSeconds] = useState(0);

  // Cold-start timer for UI feedback
  useEffect(() => {
    if (!serverDownModalOpen) {
      setColdStartSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setColdStartSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [serverDownModalOpen]);

  // Console Command Interface for Developer Settings & Cold-Start Management
  useEffect(() => {
    const openSettings = () => {
      setBackendSettingsOpen(true);
      console.log('%c[AsanaSense]%c Settings modal opened.', 'color: #059669; font-weight: bold;', 'color: inherit;');
      return 'Opened Asana Sense Settings Modal';
    };

    const closeSettings = () => {
      setBackendSettingsOpen(false);
      console.log('%c[AsanaSense]%c Settings modal closed.', 'color: #059669; font-weight: bold;', 'color: inherit;');
      return 'Closed Asana Sense Settings Modal';
    };

    const startColdWakeSequence = async () => {
      const targetUrl = getBackendUrl();
      console.log(
        `%c[AsanaSense Server]%c 🚀 Initiating active wake-up ping sequence for %c${targetUrl}`,
        'color: #0284c7; font-weight: bold;',
        'color: inherit;',
        'color: #059669; font-weight: bold;'
      );
      console.info(
        '%c[AsanaSense Server]%c Cloud servers take 30–50s to wake up from rest. Pinging /api/health every 3s until online...',
        'color: #d97706; font-weight: bold;',
        'color: inherit;'
      );

      let attempts = 0;
      const startMs = Date.now();

      return new Promise<{ online: boolean; totalSeconds: number; attempts: number }>((resolve) => {
        // Immediate first check
        void (async () => {
          try {
            const immediateOk = await apiHealthCheck();
            if (immediateOk) {
              console.log(
                '%c[AsanaSense Server]%c ✅ Server is ALREADY online and ready! (200 OK)',
                'color: #059669; font-weight: bold;',
                'color: inherit;'
              );
              setServerDownModalOpen(false);
              resolve({ online: true, totalSeconds: 0, attempts: 1 });
              return;
            }
          } catch {
            // continue to loop
          }
        })();

        const intervalId = setInterval(async () => {
          attempts++;
          const elapsed = Math.round((Date.now() - startMs) / 1000);
          try {
            const isOnline = await apiHealthCheck();
            if (isOnline) {
              clearInterval(intervalId);
              console.log(
                `%c[AsanaSense Server]%c ✅ Server is awake and connected! (200 OK after ${elapsed}s across ${attempts} pings)`,
                'color: #059669; font-weight: bold;',
                'color: inherit;'
              );
              setServerDownModalOpen(false);
              soundEngine.playChime(660, 0.8);
              resolve({ online: true, totalSeconds: elapsed, attempts });
              return;
            }
          } catch {
            // Still spinning up
          }

          console.log(
            `[AsanaSense Server] ⏳ Ping #${attempts} (${elapsed}s elapsed): Server is waking up...`
          );

          if (elapsed >= 120) {
            clearInterval(intervalId);
            console.warn(
              '[AsanaSense Server] ⚠️ Ping sequence reached 120s limit. Check your hosted server dashboard.'
            );
            resolve({ online: false, totalSeconds: elapsed, attempts });
          }
        }, 3000);
      });
    };

    // Direct Console Function Aliases
    (window as any).openAsanaSettings = openSettings;
    (window as any).openSettings = openSettings;
    (window as any).settings = openSettings;
    (window as any).asanaSettings = openSettings;
    (window as any).coldRestart = startColdWakeSequence;
    (window as any).wakeServer = startColdWakeSequence;
    (window as any).wake = startColdWakeSequence;

    // Comprehensive asana object
    (window as any).asana = {
      settings: openSettings,
      openSettings: openSettings,
      closeSettings: closeSettings,
      coldRestart: startColdWakeSequence,
      wake: startColdWakeSequence,
      wakeServer: startColdWakeSequence,
      backend: (url?: string) => {
        if (url && typeof url === 'string') {
          setBackendUrl(url);
          console.log(`%c[AsanaSense]%c Backend URL set to: %c${url}`, 'color: #059669;', 'color: inherit;', 'color: #0284c7; font-weight: bold;');
          return `Backend URL updated to: ${url}`;
        }
        return getBackendUrl();
      },
      status: async () => {
        const report = await checkBackendConnection();
        console.table(report);
        return report;
      },
      checkHealth: async () => {
        const isOnline = await apiHealthCheck();
        console.log('Health check result:', isOnline ? 'Online (200 OK)' : 'Offline / Cold Start');
        return isOnline;
      },
      help: () => {
        console.group('%c🧘 Asana Sense Developer & System Commands', 'color: #059669; font-weight: bold; font-size: 13px;');
        console.log('%casana.settings()%c or %csettings()%c       - Open backend & OAuth settings modal', 'color: #0284c7; font-weight: bold;', 'color: inherit;', 'color: #0284c7; font-weight: bold;', 'color: inherit;');
        console.log('%casana.coldRestart()%c or %cwake()%c        - Actively wake up cold server with live console progress', 'color: #0284c7; font-weight: bold;', 'color: inherit;', 'color: #0284c7; font-weight: bold;', 'color: inherit;');
        console.log('%casana.status()%c                          - Print backend latency & connection diagnostics table', 'color: #0284c7; font-weight: bold;', 'color: inherit;');
        console.log('%casana.backend("https://...")%c            - View or update backend API URL', 'color: #0284c7; font-weight: bold;', 'color: inherit;');
        console.log('%casana.checkHealth()%c                     - Run immediate /api/health probe', 'color: #0284c7; font-weight: bold;', 'color: inherit;');
        console.groupEnd();
        return 'Type any command above to run.';
      },
    };

    console.info(
      '%c[AsanaSense]%c Settings are hidden in the UI. Type %casana.settings()%c or %csettings()%c to open settings. Type %casana.wake()%c or %cwake()%c to handle cold starts.',
      'color: #059669; font-weight: bold;',
      'color: inherit;',
      'color: #0284c7; font-weight: bold;',
      'color: inherit;',
      'color: #0284c7; font-weight: bold;',
      'color: inherit;',
      'color: #d97706; font-weight: bold;',
      'color: inherit;',
      'color: #d97706; font-weight: bold;',
      'color: inherit;'
    );
  }, []);

  // Background Auto-Polling when Server is Down (auto-closes modal & resumes practice upon recovery)
  useEffect(() => {
    if (!serverDownModalOpen) {
      setAutoPollAttempts(0);
      return;
    }

    console.warn(
      '%c[AsanaSense Backend]%c Server is offline or waking up from cold start. Auto-polling /api/health...',
      'color: #d97706; font-weight: bold;',
      'color: inherit;'
    );

    let isSubscribed = true;
    const intervalId = setInterval(async () => {
      try {
        const isOnline = await apiHealthCheck();
        if (isOnline && isSubscribed) {
          clearInterval(intervalId);
          console.log(
            '%c[AsanaSense Backend]%c Server is awake and connected! Health check 200 OK. Auto-launching practice session...',
            'color: #059669; font-weight: bold;',
            'color: inherit;'
          );
          setServerDownModalOpen(false);
          soundEngine.playChime(660, 0.8);
          const poseToStart = pendingPoseAfterCheck;
          setPendingPoseAfterCheck(undefined);
          if (poseToStart !== undefined) {
            handleInitiateSession(poseToStart);
          }
        } else if (isSubscribed) {
          setAutoPollAttempts((prev) => {
            const next = prev + 1;
            console.info(`[AsanaSense Backend] Cold start waking up... (Health check #${next})`);
            return next;
          });
        }
      } catch {
        if (isSubscribed) {
          setAutoPollAttempts((prev) => {
            const next = prev + 1;
            console.info(`[AsanaSense Backend] Cold start waking up... (Health check #${next})`);
            return next;
          });
        }
      }
    }, 3500);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [serverDownModalOpen, pendingPoseAfterCheck]);

  // Auto-dismiss welcome toast after 8 seconds
  useEffect(() => {
    if (welcomeToast) {
      const timer = setTimeout(() => setWelcomeToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [welcomeToast]);

  // Listen to browser navigation & URL route changes
  useEffect(() => {
    const handleLocationCheck = () => {
      const path = window.location.pathname.toLowerCase().trim();
      const validPaths = ['/', '', '/index.html'];
      setIsNotFound(!validPaths.includes(path));
    };

    window.addEventListener('popstate', handleLocationCheck);
    return () => window.removeEventListener('popstate', handleLocationCheck);
  }, []);

  useEffect(() => {
    if (emptySessionNotice) {
      const timer = setTimeout(() => setEmptySessionNotice(null), 5500);
      return () => clearTimeout(timer);
    }
  }, [emptySessionNotice]);

  // Poses from API or fallback
  const [poses, setPoses] = useState<YogaPose[]>(ALL_POSES);

  // Active view: 'home' or 'live-session'
  const [activeView, setActiveView] = useState<'home' | 'live-session'>('home');
  const [sessionInitialPoseId, setSessionInitialPoseId] = useState<string | undefined>(undefined);

  // Router loading transition state
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Veda AI Biomechanics Studio...');

  // Full-screen Session Loading Transition (Launch & Exit)
  const [sessionTransition, setSessionTransition] = useState<{
    mode: 'launch' | 'exit';
    targetPoseName?: string;
    customMessage?: string;
    onComplete: () => void;
  } | null>(null);

  // Flag to trigger entry animation ONLY on initial sign-in
  const [isInitialSignInAnimation, setIsInitialSignInAnimation] = useState(false);

  // Pending session start queue
  const [pendingStartSession, setPendingStartSession] = useState(false);
  const [pendingPoseId, setPendingPoseId] = useState<string | undefined>(undefined);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState('');
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [privacyTermsModalOpen, setPrivacyTermsModalOpen] = useState(false);
  const [privacyTermsTab, setPrivacyTermsTab] = useState<'privacy' | 'terms' | 'disclaimer'>('privacy');
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [backendSettingsOpen, setBackendSettingsOpen] = useState(false);
  const [inspectingPose, setInspectingPose] = useState<YogaPose | null>(null);
  const [completedSession, setCompletedSession] = useState<PracticeSession | null>(null);
  const [mobileNoticeModalOpen, setMobileNoticeModalOpen] = useState(false);
  const [mobileNoticePoseName, setMobileNoticePoseName] = useState<string | undefined>(undefined);

  // Check URL parameters, hash, or path for direct password reset links
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      let hashString = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      if (hashString.includes('?')) {
        hashString = hashString.split('?')[1];
      }
      const hashParams = new URLSearchParams(hashString);

      const token = searchParams.get('token') || 
                    searchParams.get('reset_token') || 
                    searchParams.get('reset-token') || 
                    hashParams.get('token') || 
                    hashParams.get('reset_token');

      const email = searchParams.get('email') || 
                    searchParams.get('user_email') || 
                    hashParams.get('email') || 
                    hashParams.get('user_email');

      const mode = searchParams.get('mode') || hashParams.get('mode');
      const pathname = window.location.pathname.toLowerCase();
      const isResetPath = pathname.includes('reset-password') || pathname.includes('reset_password');

      if (token || mode === 'reset-password' || isResetPath) {
        if (token) setResetPasswordToken(token);
        if (email) setResetPasswordEmail(email);
        setResetPasswordModalOpen(true);
      }
    } catch (e) {
      console.warn('[App] URL reset password parse error:', e);
    }
  }, []);

  // Load user profile from API on mount (if JWT token exists)
  useEffect(() => {
    async function loadProfile() {
      const token = getToken();
      if (token) {
        const profile = await fetchUserProfileFromAPI();
        if (profile) {
          setUserProfile(profile);
        }
      } else {
        // Check localStorage fallback
        const cached = getStoredUserProfile();
        if (cached) setUserProfile(cached);
      }
    }
    loadProfile();
  }, []);

  // Load poses from API
  useEffect(() => {
    async function loadPoses() {
      try {
        const apiPoses = await fetchPosesFromAPI();
        if (apiPoses.length > 0) {
          setPoses(apiPoses);
        }
      } catch {
        // Fallback already set
      }
    }
    loadPoses();
  }, []);

  // Helper to trigger animated loading transition
  const triggerViewTransition = (targetView: 'home' | 'live-session', message: string, callback?: () => void) => {
    setLoadingMessage(message);
    setIsAppLoading(true);
    setTimeout(() => {
      setActiveView(targetView);
      if (callback) callback();
      setTimeout(() => {
        setIsAppLoading(false);
      }, 400);
    }, 700);
  };

  // Exit session handler with dedicated exit loading animation screen
  const handleExitSession = (callback?: () => void) => {
    sessionStorage.setItem('asana_exited_session', 'true');
    // Increment rotation offset so pose order shifts forward on home page & in future sessions
    // Applies for both signed-in accounts and guest users!
    incrementSessionRotationOffset(1);
    setPoseRotationOffset(getSessionRotationOffset());
    setIsInitialSignInAnimation(false);
    setSessionTransition({
      mode: 'exit',
      customMessage: 'Returning to Sanctuary Dashboard...',
      onComplete: () => {
        setSessionTransition(null);
        setActiveView('home');
        if (callback) callback();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Handle smooth scroll to section
  const handleScrollToSection = (id: string) => {
    if (activeView !== 'home') {
      handleExitSession(() => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Central Session Trigger: performs pre-flight FastAPI health check before entering live session
  const GUEST_ALLOWED_POSES = ['dog', 'warrior', 'tree'];

  const handleInitiateSession = async (poseId?: string) => {
    // Intercept Mobile Devices: Play spoken voice advisory and show desktop recommendation modal
    if (isMobileDevice()) {
      const targetPose = poseId ? poses.find((p) => p.id === poseId) : undefined;
      setMobileNoticePoseName(targetPose?.name);
      setMobileNoticeModalOpen(true);
      return;
    }

    // Allow guest users to proceed into the live session with their selected pose;
    // locked poses will display a polite guest advisory with right-arrow shelf guidance inside the studio.

    // Pre-flight check: Verify FastAPI backend is online
    try {
      const isOnline = await apiHealthCheck();
      if (!isOnline) {
        setPendingPoseAfterCheck(poseId);
        setServerDownModalOpen(true);
        return;
      }
    } catch {
      setPendingPoseAfterCheck(poseId);
      setServerDownModalOpen(true);
      return;
    }

    sessionStorage.setItem('asana_entered_session', 'true');
    setIsInitialSignInAnimation(false);

    // Default guest initial pose to 'dog' (Downward Dog) if none specified
    const initialPose = poseId || (!userProfile ? 'dog' : undefined);
    setSessionInitialPoseId(initialPose);
    setInspectingPose(null);
    const targetPose = poses.find((p) => p.id === initialPose);

    setSessionTransition({
      mode: 'launch',
      targetPoseName: targetPose?.name,
      onComplete: () => {
        setSessionTransition(null);
        setActiveView('live-session');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Retry Connection from Server Down Dialog
  const handleRetryBackendCheck = async () => {
    setIsRetryingConnection(true);
    try {
      const isOnline = await apiHealthCheck();
      if (isOnline) {
        setServerDownModalOpen(false);
        setIsRetryingConnection(false);
        const poseToStart = pendingPoseAfterCheck;
        setPendingPoseAfterCheck(undefined);
        handleInitiateSession(poseToStart);
        return;
      }
    } catch {
      // Still offline
    }
    setIsRetryingConnection(false);
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // On Auth success
  const handleAuthSuccess = (profile: UserProfile, isNewSignUp = false) => {
    saveUserProfile(profile);
    const resolvedProfile = getStoredUserProfile() || profile;
    setUserProfile(resolvedProfile);
    sessionStorage.setItem('asana_signed_in', 'true');
    sessionStorage.removeItem('asana_entered_session');
    sessionStorage.removeItem('asana_exited_session');
    sessionStorage.removeItem('asana_generated_report');
    setIsInitialSignInAnimation(true);

    const cleanEmail = (resolvedProfile.email || '').trim().toLowerCase();
    const hasSeenWelcome = cleanEmail ? localStorage.getItem(`asana_welcomed_${cleanEmail}`) === 'true' : false;

    if (isNewSignUp && !hasSeenWelcome) {
      if (cleanEmail) {
        localStorage.setItem(`asana_welcomed_${cleanEmail}`, 'true');
      }
      setWelcomeToast({ name: resolvedProfile.name, email: resolvedProfile.email || '' });
      soundEngine.playChime(528, 1.8);
      setTimeout(() => {
        soundEngine.speak(`Welcome to Asana Sense, ${resolvedProfile.name}! Your mindful yoga journey begins today.`);
      }, 500);
    }

    if (pendingStartSession) {
      setPendingStartSession(false);
      const poseToUse = pendingPoseId;
      setPendingPoseId(undefined);

      if (isMobileDevice()) {
        const targetPose = poseToUse ? poses.find((p) => p.id === poseToUse) : undefined;
        setMobileNoticePoseName(targetPose?.name);
        setMobileNoticeModalOpen(true);
      } else {
        setSessionInitialPoseId(poseToUse);
        setInspectingPose(null);
        sessionStorage.setItem('asana_entered_session', 'true');
        setIsInitialSignInAnimation(false);
        triggerViewTransition('live-session', 'Preparing Live Studio...', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    } else if (isNewSignUp && !profile.has_completed_onboarding && !profile.hasCompletedOnboarding) {
      setOnboardingModalOpen(true);
    }
  };

  // On Pre-Session Questionnaire Complete
  const handleOnboardingComplete = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    saveUserProfile(updatedProfile);
    setOnboardingModalOpen(false);

    const poseToUse = pendingPoseId;
    const shouldStart = pendingStartSession || Boolean(poseToUse);
    setPendingStartSession(false);
    setPendingPoseId(undefined);

    if (shouldStart) {
      if (isMobileDevice()) {
        const targetPose = poseToUse ? poses.find((p) => p.id === poseToUse) : undefined;
        setMobileNoticePoseName(targetPose?.name);
        setMobileNoticeModalOpen(true);
      } else {
        setSessionInitialPoseId(poseToUse);
        setInspectingPose(null);
        sessionStorage.setItem('asana_entered_session', 'true');
        setIsInitialSignInAnimation(false);
        triggerViewTransition('live-session', 'Setting up personalized session...', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
  };

  // On Session finished: synthesize report and open as in-session overlay directly over the active session
  const handleSessionFinished = (session: PracticeSession) => {
    const rawPoses = session.posesRecorded || (session as any).poses_recorded || [];
    const validPoses = rawPoses.filter(
      (p: any) => (p.durationSeconds || p.duration_seconds || p.bestHoldSeconds || p.best_hold_seconds || 0) > 0
    );

    // If no poses were recorded/practiced: DO NOT send email, DO NOT generate report, display toast notice
    if (rawPoses.length === 0 || validPoses.length === 0) {
      handleExitSession();
      setEmptySessionNotice('Session ended with no poses recorded. No report was generated and no email was sent.');
      setTimeout(() => setEmptySessionNotice(null), 6000);
      return;
    }

    setIsInitialSignInAnimation(false);
    setSessionTransition({
      mode: 'exit',
      customMessage: 'Synthesizing Veda AI Biomechanics Insights & Session Report...',
      onComplete: () => {
        setSessionTransition(null);
        setCompletedSession(session);
        // In-Session Overlay: keep activeView in live-session so "Return to Session" preserves state
        sessionStorage.setItem('asana_generated_report', 'true');
        window.scrollTo({ top: 0 });

        // Persist + refresh stats + dispatch email in the background so network latency never blocks report display
        void (async () => {
          try {
            await saveSessionRecord(session, userProfile?.email);
          } catch (err) {
            console.warn('[App] Failed to save session record:', err);
          }
          // Check strict 5-second hold requirement: only send session summary email if at least one pose was held for >= 5s
          const posesWithMinHold = (session.posesRecorded || []).filter(
            (p) => (p.durationSeconds || 0) >= 5 || (p.bestHoldSeconds || 0) >= 5
          );

          if (userProfile?.email && posesWithMinHold.length > 0) {
            try {
              await apiSendSessionEmail({
                sessionData: session,
                to_email: userProfile.email,
              });
              console.log('[App] Session report email dispatched to:', userProfile.email);
            } catch (emailErr) {
              console.warn('[App] Background email dispatch notice:', emailErr);
            }
          } else if (userProfile?.email && posesWithMinHold.length === 0) {
            console.log('[App] Session had no poses held for >= 5 seconds. Skipping email dispatch as requested.');
          }
          try {
            const updated = await fetchUserProfileFromAPI();
            if (updated) setUserProfile(updated);
          } catch (err) {
            console.warn('[App] Failed to refresh profile:', err);
          }
        })();
      },
    });
  };

  // Close the report (X, footer button, backdrop, Escape, Exit to Dashboard):
  // always plays the exit loading screen. The report stays mounted underneath until the
  // transition finishes so the viewport never flashes blank.
  const handleCloseReport = () => {
    if (sessionTransition) return; // already exiting
    handleExitSession(() => setCompletedSession(null));
  };

  // Handle logout
  const handleLogout = () => {
    apiLogout();
    setUserProfile(null);
    setProfileModalOpen(false);
  };

  // Session storage flags for Hero animation
  const userSignedInStorage = sessionStorage.getItem('asana_signed_in') === 'true';
  const userEnteredStorage = sessionStorage.getItem('asana_entered_session') === 'true';
  const userExitedStorage = sessionStorage.getItem('asana_exited_session') === 'true';

  const showLaunchAnimation = Boolean(
    userProfile &&
    (isInitialSignInAnimation || userSignedInStorage) &&
    !userEnteredStorage &&
    !userExitedStorage
  );

  // Handle Back to Homepage from 404 page
  const handleBackHome = () => {
    window.history.pushState(null, '', '/');
    setIsNotFound(false);
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isNotFound) {
    return <NotFoundPage onBackHome={handleBackHome} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {isAppLoading && <AppLoading message={loadingMessage} />}

      {/* Welcome Celebration Banner Toast upon New Account Sign-Up */}
      {welcomeToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-stone-900/95 to-teal-950/95 text-stone-100 text-xs sm:text-sm font-medium shadow-2xl border border-emerald-400/50 backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ring-4 ring-emerald-500/10">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Welcome to ASANA - SENSE, {welcomeToast.name}!</span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-300 mt-0.5 leading-relaxed">
              Your mindful yoga journey begins today. A welcome confirmation has been prepared for <span className="font-semibold text-emerald-300">{welcomeToast.email}</span>.
            </p>
          </div>
          <button
            onClick={() => setWelcomeToast(null)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition ml-1 cursor-pointer shrink-0 hover:bg-stone-800/80"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty Session Feedback Notification Toast */}
      {emptySessionNotice && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/95 text-stone-200 text-xs sm:text-sm font-medium shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{emptySessionNotice}</span>
          <button
            onClick={() => setEmptySessionNotice(null)}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeView === 'home' && (
        <Navbar
          userProfile={userProfile}
          onOpenAuth={handleOpenAuth}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenSettings={() => setBackendSettingsOpen(true)}
          onStartLiveSession={() => handleInitiateSession(undefined)}
          onScrollToSection={handleScrollToSection}
        />
      )}

      {/* Precautionary Health & Dietary Advisory Bar on Dashboard (For Guests & Authorized Users) */}
      {activeView === 'home' && !homeAdvisoryDismissed && (
        <aside aria-label="Health and practice safety notice" className="bg-gradient-to-r from-amber-50 via-stone-50 to-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-950 transition-all z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                <Info className="w-3.5 h-3.5" />
              </span>
              <p className="text-[11px] sm:text-xs text-amber-900 leading-snug">
                <strong className="font-bold text-amber-950 uppercase text-[10px] tracking-wide mr-1.5 bg-amber-200/70 px-1.5 py-0.5 rounded">
                  Practice Precaution
                </strong>
                Avoid performing yoga postures immediately after eating. Wait at least <span className="font-semibold text-amber-950">2 to 3 hours</span> after a full meal (or <span className="font-semibold text-amber-950">45–60 minutes</span> after a light snack) for comfortable digestion and alignment.
              </p>
            </div>
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('asana_dietary_advisory_dismissed', 'true');
                } catch {
                  // ignore
                }
                setHomeAdvisoryDismissed(true);
              }}
              className="p-1 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-amber-200/60 transition cursor-pointer shrink-0"
              title="Dismiss Advisory"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {activeView === 'live-session' ? (
        <ErrorBoundary
          fullScreen
          fallbackMessage="Unable to display the live yoga studio. Returning you safely to the home dashboard."
          onReset={() => handleExitSession()}
        >
          <LivePostureSession
            userProfile={userProfile}
            initialPoseId={sessionInitialPoseId}
            poseRotationOffset={poseRotationOffset}
            onFinishSession={handleSessionFinished}
            onClose={() => handleExitSession()}
            onOpenAuth={() => handleOpenAuth('signup')}
            onOpenSettings={() => setBackendSettingsOpen(true)}
            onNoPosesPracticed={() => {
              handleExitSession();
              setEmptySessionNotice('Session ended with no poses recorded. No report was generated and no email was sent.');
              setTimeout(() => setEmptySessionNotice(null), 6000);
            }}
          />
        </ErrorBoundary>
      ) : (
        <main className="flex-1">
          <HeroSection
            userProfile={userProfile}
            poseRotationOffset={poseRotationOffset}
            isInitialSignInAnimation={showLaunchAnimation}
            onStartPractice={() => handleInitiateSession(undefined)}
            onOpenAuth={handleOpenAuth}
            onExplorePoses={() => handleScrollToSection('pose-carousel-showcase')}
          />
          <PoseCarousel
            userProfile={userProfile}
            poseRotationOffset={poseRotationOffset}
            onSelectPoseForPractice={(pose) => handleInitiateSession(pose.id)}
            onViewPoseDetails={(pose) => {
              if (!userProfile) {
                handleOpenAuth('signup');
              } else {
                setInspectingPose(pose);
              }
            }}
            onOpenAuth={() => handleOpenAuth('signup')}
          />
          <FeatureColumns
            onOpenLivePractice={() => handleInitiateSession(undefined)}
            onOpenAuth={() => handleOpenAuth('signup')}
            onOpenVoiceGuide={() => handleInitiateSession(undefined)}
          />
        </main>
      )}

      {activeView === 'home' && (
        <Footer
          onScrollTo={handleScrollToSection}
          onOpenLiveSession={() => handleInitiateSession(undefined)}
          onOpenSettings={() => setBackendSettingsOpen(true)}
          onOpenPrivacyTerms={(tab) => {
            setPrivacyTermsTab(tab);
            setPrivacyTermsModalOpen(true);
          }}
        />
      )}

      <PrivacyTermsModal
        isOpen={privacyTermsModalOpen}
        initialTab={privacyTermsTab}
        onClose={() => setPrivacyTermsModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingStartSession(false);
        }}
        onAuthSuccess={handleAuthSuccess}
        onOpenResetPasswordModal={(prefilledEmail) => {
          if (prefilledEmail) setResetPasswordEmail(prefilledEmail);
          setResetPasswordModalOpen(true);
        }}
      />

      <ResetPasswordModal
        isOpen={resetPasswordModalOpen}
        initialEmail={resetPasswordEmail}
        initialToken={resetPasswordToken}
        onClose={() => setResetPasswordModalOpen(false)}
        onSuccessOpenSignIn={(email) => {
          setResetPasswordModalOpen(false);
          setAuthMode('signin');
          setAuthModalOpen(true);
        }}
      />

      <CookieConsentBanner />

      {userProfile && (
        <PreSessionOnboardingModal
          isOpen={onboardingModalOpen}
          userProfile={userProfile}
          onClose={() => {
            setOnboardingModalOpen(false);
            setPendingPoseId(undefined);
          }}
          onComplete={handleOnboardingComplete}
        />
      )}

      {userProfile && (
        <UserProfileModal
          user={userProfile}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onLogout={handleLogout}
          onSelectPastSession={(sess) => setCompletedSession(sess)}
          onOpenOnboarding={() => setOnboardingModalOpen(true)}
          onUpdateUser={(updated) => setUserProfile(updated)}
        />
      )}

      {inspectingPose && (
        <PoseDetailModal
          pose={inspectingPose}
          onClose={() => setInspectingPose(null)}
          onStartPractice={(pose) => handleInitiateSession(pose.id)}
        />
      )}

      <BackendSettingsModal
        isOpen={backendSettingsOpen}
        onClose={() => setBackendSettingsOpen(false)}
      />

      {completedSession && (
        <ErrorBoundary
          fullScreen
          fallbackMessage="Unable to render the session report at this moment. Your practice data has been safely recorded in your history."
          onReset={() => setCompletedSession(null)}
        >
          <SessionReportModal
            session={completedSession}
            userProfile={userProfile}
            isHistoryView={activeView === 'home'}
            onClose={() => setCompletedSession(null)}
            // 1. Continue in session: simply hides the modal overlay; activeView stays 'live-session'
            onReturnToSession={() => {
              setCompletedSession(null);
              if (activeView !== 'live-session') {
                setActiveView('live-session');
              }
            }}
            // 2. Exit session: closes report and switches back to home dashboard
            onExitToDashboard={() => {
              setCompletedSession(null);
              sessionStorage.setItem('asana_exited_session', 'true');
              if (activeView === 'live-session') {
                handleExitSession();
              } else {
                setActiveView('home');
              }
            }}
            onOpenAuth={() => {
              setCompletedSession(null);
              handleOpenAuth('signup');
            }}
            onUserAuthenticated={(u) => setUserProfile(u)}
            onRestartPractice={() => {
              setCompletedSession(null);
              handleInitiateSession(undefined);
            }}
          />
        </ErrorBoundary>
      )}

      {/* Rendered last so it always sits above the report modal & other overlays */}
      {/* Dedicated Animated Launch & Exit Telemetry Transition */}
      {sessionTransition && (
        <SessionLoadingTransition
          mode={sessionTransition.mode}
          targetPoseName={sessionTransition.targetPoseName}
          customMessage={sessionTransition.customMessage}
          onComplete={sessionTransition.onComplete}
        />
      )}

      {/* Server Cold Start & Warming Up Modal */}
      {serverDownModalOpen && (
        <div
          id="server-down-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setServerDownModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-stone-900 relative text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-7 h-7 animate-spin" style={{ animationDuration: '3.5s' }} />
            </div>

            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 uppercase tracking-wider inline-block">
                Server Waking Up
              </span>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Warming Up Connection
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                The server rests when not in use and takes about 30 to 45 seconds to wake back up. We are actively waking it up right now.
              </p>
            </div>

            {/* Live Auto-Polling Recovery Banner with Timer */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 space-y-2 text-stone-700 text-xs shadow-xs text-left">
              <div className="flex items-center justify-between text-amber-900 font-semibold text-xs">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <span>Connecting to server...</span>
                </span>
                <span className="text-[11px] font-mono text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold">
                  {coldStartSeconds}s elapsed
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Checking server response (attempt #{autoPollAttempts}). Please leave this open; your session will launch automatically as soon as it responds.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleRetryBackendCheck}
                disabled={isRetryingConnection}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-900/20 disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetryingConnection ? 'animate-spin' : ''}`} />
                <span>{isRetryingConnection ? 'Checking Connection...' : 'Check Server Now'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setServerDownModalOpen(false)}
              className="text-xs text-stone-400 hover:text-stone-600 transition block mx-auto cursor-pointer pt-1"
            >
              Stay on Sanctuary Dashboard
            </button>
          </div>
        </div>
      )}

      {/* New User Signup Welcome Toast Notification */}
      {welcomeToast && (
        <WelcomeToast
          name={welcomeToast.name}
          email={welcomeToast.email}
          onClose={() => setWelcomeToast(null)}
        />
      )}

      {/* Mobile Device Advisory Modal with Voice Guidance */}
      <MobileDesktopNoticeModal
        isOpen={mobileNoticeModalOpen}
        onClose={() => setMobileNoticeModalOpen(false)}
        targetPoseName={mobileNoticePoseName}
      />
    </div>
  );
}
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
import { AppLoading } from './components/AppLoading';
import { SessionLoadingTransition } from './components/SessionLoadingTransition';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import type { UserProfile, YogaPose, PracticeSession } from './types';
import { getStoredUserProfile, saveUserProfile, saveSessionRecord, fetchUserProfileFromAPI } from './utils/profileStorage';
import { getToken, apiLogout } from './utils/apiClient';
import { fetchPosesFromAPI, ALL_POSES } from './data/yogaPoses';

export default function App() {
  // User profile & auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [inspectingPose, setInspectingPose] = useState<YogaPose | null>(null);
  const [completedSession, setCompletedSession] = useState<PracticeSession | null>(null);

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

  // Central Session Trigger: launches Live Session with launch loading screen
  const handleInitiateSession = (poseId?: string) => {
    if (!userProfile) {
      setPendingPoseId(poseId);
      setPendingStartSession(true);
      setAuthMode('signup');
      setAuthModalOpen(true);
      return;
    }

    sessionStorage.setItem('asana_entered_session', 'true');
    setIsInitialSignInAnimation(false);

    setSessionInitialPoseId(poseId);
    setInspectingPose(null);
    const targetPose = poses.find((p) => p.id === poseId);

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

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // On Auth success
  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
    sessionStorage.setItem('asana_signed_in', 'true');
    sessionStorage.removeItem('asana_entered_session');
    sessionStorage.removeItem('asana_exited_session');
    sessionStorage.removeItem('asana_generated_report');
    setIsInitialSignInAnimation(true);

    if (pendingStartSession) {
      setPendingStartSession(false);
      const poseToUse = pendingPoseId;
      setPendingPoseId(undefined);
      setSessionInitialPoseId(poseToUse);
      setInspectingPose(null);
      sessionStorage.setItem('asana_entered_session', 'true');
      setIsInitialSignInAnimation(false);
      triggerViewTransition('live-session', 'Preparing Live Studio...', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else if (!profile.has_completed_onboarding && !profile.hasCompletedOnboarding) {
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
      setSessionInitialPoseId(poseToUse);
      setInspectingPose(null);
      sessionStorage.setItem('asana_entered_session', 'true');
      setIsInitialSignInAnimation(false);
      triggerViewTransition('live-session', 'Setting up personalized session...', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  // On Session finished: synthesize report and open as in-session overlay directly over the active session
  const handleSessionFinished = (session: PracticeSession) => {
    setIsInitialSignInAnimation(false);
    setSessionTransition({
      mode: 'exit',
      customMessage: 'Synthesizing Groq AI Posture Insights & Report...',
      onComplete: () => {
        setSessionTransition(null);
        setCompletedSession(session);
        // In-Session Overlay: keep activeView in live-session so "Return to Session" preserves state
        sessionStorage.setItem('asana_generated_report', 'true');
        window.scrollTo({ top: 0 });

        // Persist + refresh stats in the background so a slow/failed network never blocks the report
        void (async () => {
          try {
            await saveSessionRecord(session);
          } catch (err) {
            console.warn('[App] Failed to save session record:', err);
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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {isAppLoading && <AppLoading message={loadingMessage} />}

      {activeView === 'home' && (
        <Navbar
          userProfile={userProfile}
          onOpenAuth={handleOpenAuth}
          onOpenProfile={() => setProfileModalOpen(true)}
          onStartLiveSession={() => handleInitiateSession(undefined)}
          onScrollToSection={handleScrollToSection}
        />
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
            onFinishSession={handleSessionFinished}
            onClose={() => handleExitSession()}
            onOpenAuth={() => handleOpenAuth('signup')}
          />
        </ErrorBoundary>
      ) : (
        <main className="flex-1">
          <HeroSection
            userProfile={userProfile}
            isInitialSignInAnimation={showLaunchAnimation}
            onStartPractice={() => handleInitiateSession(undefined)}
            onOpenAuth={handleOpenAuth}
            onExplorePoses={() => handleScrollToSection('pose-carousel-showcase')}
          />
          <PoseCarousel
            userProfile={userProfile}
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
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingStartSession(false);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

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
        />
      )}

      {inspectingPose && (
        <PoseDetailModal
          pose={inspectingPose}
          onClose={() => setInspectingPose(null)}
          onStartPractice={(pose) => handleInitiateSession(pose.id)}
        />
      )}

      {completedSession && (
        <ErrorBoundary
          fullScreen
          fallbackMessage="Unable to render the session report at this moment. Your practice data has been safely recorded in your history."
          onReset={() => setCompletedSession(null)}
        >
          <SessionReportModal
            session={completedSession}
            userProfile={userProfile}
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
    </div>
  );
}
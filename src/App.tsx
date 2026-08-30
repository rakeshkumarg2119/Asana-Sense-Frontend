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
import { Footer } from './components/Footer';
import { UserProfile, YogaPose, PracticeSession } from './types';
import { getStoredUserProfile, saveUserProfile, saveSessionRecord } from './utils/profileStorage';

export default function App() {
  // User profile & auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Active view: 'home' or 'live-session'
  const [activeView, setActiveView] = useState<'home' | 'live-session'>('home');
  const [sessionInitialPoseId, setSessionInitialPoseId] = useState<string | undefined>(undefined);

  // Router loading transition state
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Veda AI Biomechanics Studio...');

  // Flag to trigger entry animation ONLY on initial sign-in, suppressed after session completion
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

  // Load existing user profile on mount
  useEffect(() => {
    const existing = getStoredUserProfile();
    if (existing) {
      setUserProfile(existing);
    }
  }, []);

  // Helper to trigger animated loading transition during view switches
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

  // Handle smooth scroll to section
  const handleScrollToSection = (id: string) => {
    if (activeView !== 'home') {
      triggerViewTransition('home', 'Returning to Home Dashboard...', () => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Central Session Trigger: enforces Auth -> Onboarding Questionnaire -> Live Session
  const handleInitiateSession = (poseId?: string) => {
    // 1. Check if user is authenticated
    if (!userProfile) {
      setPendingPoseId(poseId);
      setPendingStartSession(true);
      setAuthMode('signup');
      setAuthModalOpen(true);
      return;
    }

    // Record session entry in browser session storage
    sessionStorage.setItem('asana_entered_session', 'true');
    setIsInitialSignInAnimation(false);

    // 2. Check if user has answered the onboarding questionnaire
    if (!userProfile.hasCompletedOnboarding) {
      setPendingPoseId(poseId);
      setOnboardingModalOpen(true);
      return;
    }

    // 3. User is authenticated & onboarded -> Start Live Session directly with transition
    setSessionInitialPoseId(poseId);
    setInspectingPose(null);
    triggerViewTransition('live-session', 'Initializing Live Posture Studio...', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Open Auth modal directly
  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // On Auth success: trigger initial sign-in entry animation flag & record session storage
  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    sessionStorage.setItem('asana_signed_in', 'true');
    sessionStorage.removeItem('asana_entered_session');
    sessionStorage.removeItem('asana_exited_session');
    sessionStorage.removeItem('asana_generated_report');
    setIsInitialSignInAnimation(true);

    if (!profile.hasCompletedOnboarding) {
      // Immediately open the 3 AI Personalization Questions on Sign Up
      setOnboardingModalOpen(true);
    } else if (pendingStartSession) {
      // If already onboarded and they clicked start session, launch live session
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
    }
  };

  // On Pre-Session Questionnaire Complete
  const handleOnboardingComplete = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    setOnboardingModalOpen(false);
    
    // If user was initiating a session (or just completed setup), launch session
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

  // On Session finished -> Store session record, open master report modal & SUPPRESS entry animation
  const handleSessionFinished = (session: PracticeSession) => {
    saveSessionRecord(session);
    setCompletedSession(session);
    sessionStorage.setItem('asana_generated_report', 'true');
    // Keep activeView as 'live-session' so background shows LivePostureSession and returning to session resumes instantly
    setIsInitialSignInAnimation(false);
    const updated = getStoredUserProfile();
    if (updated) setUserProfile(updated);
  };

  // Calculate session cookie / storage flag for Hero pointer animation
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
      {/* Centralized App Router Loading Screen */}
      {isAppLoading && <AppLoading message={loadingMessage} />}

      {/* Top Navigation */}
      {activeView === 'home' && (
        <Navbar
          userProfile={userProfile}
          onOpenAuth={handleOpenAuth}
          onOpenProfile={() => setProfileModalOpen(true)}
          onStartLiveSession={() => handleInitiateSession(undefined)}
          onScrollToSection={handleScrollToSection}
        />
      )}

      {/* Main View Router */}
      {activeView === 'live-session' ? (
        <LivePostureSession
          userProfile={userProfile}
          initialPoseId={sessionInitialPoseId}
          onFinishSession={handleSessionFinished}
          onClose={() => {
            sessionStorage.setItem('asana_exited_session', 'true');
            setIsInitialSignInAnimation(false);
            setActiveView('home');
          }}
          onOpenAuth={() => handleOpenAuth('signup')}
        />
      ) : (
        <main className="flex-1">
          {/* Hero Section */}
          <HeroSection
            userProfile={userProfile}
            isInitialSignInAnimation={showLaunchAnimation}
            onStartPractice={() => handleInitiateSession(undefined)}
            onOpenAuth={handleOpenAuth}
            onExplorePoses={() => handleScrollToSection('pose-carousel-showcase')}
          />

          {/* 8 Poses Carousel Showcase */}
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

          {/* Feature Columns Highlighting Core Pillars */}
          <FeatureColumns
            onOpenLivePractice={() => handleInitiateSession(undefined)}
            onOpenAuth={() => handleOpenAuth('signup')}
            onOpenVoiceGuide={() => handleInitiateSession(undefined)}
          />
        </main>
      )}

      {/* Footer */}
      {activeView === 'home' && (
        <Footer
          onScrollTo={handleScrollToSection}
          onOpenLiveSession={() => handleInitiateSession(undefined)}
        />
      )}

      {/* Auth Modal (Sign In / Sign Up & 1-Click Test Account) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingStartSession(false);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Pre-Session Questionnaire Modal (Age, Experience, Live BMI with Animated Emojis) */}
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

      {/* User Encrypted Profile Vault Modal */}
      {userProfile && (
        <UserProfileModal
          user={userProfile}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onLogout={() => setUserProfile(null)}
          onSelectPastSession={(sess) => setCompletedSession(sess)}
          onOpenOnboarding={() => setOnboardingModalOpen(true)}
        />
      )}

      {/* Pose Inspector Modal */}
      {inspectingPose && (
        <PoseDetailModal
          pose={inspectingPose}
          onClose={() => setInspectingPose(null)}
          onStartPractice={(pose) => handleInitiateSession(pose.id)}
        />
      )}

      {/* Session Final Master Report Modal */}
      {completedSession && (
        <SessionReportModal
          session={completedSession}
          userProfile={userProfile}
          onClose={() => setCompletedSession(null)}
          onReturnToSession={() => {
            setCompletedSession(null);
            if (activeView !== 'live-session') {
              triggerViewTransition('live-session', 'Resuming Live Posture Session...', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              });
            }
          }}
          onExitToDashboard={() => {
            setCompletedSession(null);
            sessionStorage.setItem('asana_exited_session', 'true');
            setIsInitialSignInAnimation(false);
            triggerViewTransition('home', 'Returning to Home Dashboard...');
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
      )}
    </div>
  );
}

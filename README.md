# 🧘‍♀️ AsanaSense — AI-Powered Yoga Biomechanics & Real-Time Posture Coach

<p align="center">
  <img src="https://res.cloudinary.com/yhj7u0bn/image/upload/v1790602123/asana_sense_logo.png" alt="AsanaSense Logo" width="160" />
</p>

<p align="center">
  <a href="https://asana-sense-ai.vercel.app"><img src="https://img.shields.io/badge/Production-asana--sense--ai.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Live" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" /></a>
  <a href="https://developers.google.com/mediapipe"><img src="https://img.shields.io/badge/MediaPipe-Pose_Vision-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="MediaPipe" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://web.dev/progressive-web-apps/"><img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA Ready" /></a>
</p>

<p align="center">
  <b>✨ Real-time edge computer vision, hands-free voice guidance, biomechanical joint angle scoring, and zero-storage privacy for yoga practitioners worldwide. ✨</b>
</p>

---

## 🌈 Overview

**AsanaSense** is an intelligent, privacy-first yoga posture evaluation and guidance application. Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Edge Pose Vision**, AsanaSense provides yoga practitioners with:

* 🎯 **Sub-second posture alignment cues** and skeletal joint vector tracking
* 🗣️ **Hands-free continuous speech recognition** and voice commands
* 🎧 **Adaptive real-time audio guidance** & meditative ambient soundscapes
* 📊 **Comprehensive session analytics**, personal best timers, and posture score reports
* 📱 **PWA & Mobile Navigation** — installable as a native desktop/mobile app with responsive slide-over drawer
* 🔐 **Secure Authentication & OTP Verification** — 6-digit email OTP verification, password recovery, and encrypted sessions
* 🛡️ **Zero-Storage Privacy Architecture** — video frames never leave volatile browser memory

---

## ✨ Key Features

### 📷 1. Real-Time Vision & Biomechanical Scoring
- ⚡ **Real-Time Skeletal Tracking**: Multi-joint pose estimation detecting ankles, knees, hips, spine, shoulders, elbows, and wrists at up to 60 FPS.
- 📐 **Precise Joint Trigonometry**: Real-time geometric angle calculations comparing user angles against traditional yoga biomechanics standards.
- 🎯 **Interactive Viewport HUD**: Dynamic color-coded alignment circle rings, accuracy percentage pills, and hold duration counters with personal record celebrations.
- 🔄 **Dual Skeleton & Photo Overlays**: Toggle live master alignment diagrams or high-definition reference illustrations directly over the webcam feed.

### 🎤 2. Hands-Free Voice Assistant & Audio Guidance
- 🎙️ **Natural Voice Commands**: Switch poses, toggle skeleton overlays, ask questions, or control sessions completely hands-free (*"Select Warrior II"*, *"Next Pose"*, *"Pause Session"*, *"How is my alignment?"*).
- 🔊 **Live Speech Feedback**: Automatic spoken cues correcting specific joints in real time (*"Straighten your back leg"*, *"Lower your hips slightly"*).
- 🎵 **Multi-Track Meditative Ambient Player**: Built-in Web Audio API soundscapes featuring Tibetan singing bowls, monsoon rain, tranquil forest, and classical tanpura drone.

### 🧘‍♂️ 3. Interactive Pose Library & Anatomy Guide
- 📖 **Curated Pose Spectrum**: Filterable across Beginner, Intermediate, and Advanced tiers, categorized by Balance, Flexibility, Core Strength, and Spine.
- 🎨 **Original Pose Vector Artworks**: Dynamic visual art with target alignment vector indicators and anatomical focus areas.
- 🔍 **Pose Details & Safety Checks**: Deep breakdown of entry steps, contraindications, Sanskrit names, and biomechanical targets.

### 📊 4. Dynamic Live Session Reports & Email Dispatch
- 📈 **Real-Time Session Reports**: Comprehensive summaries generated directly from the poses practiced in your live session.
- ⏱️ **Hold Time Analytics**: Detailed per-pose records showing longest hold, average alignment score, and calories burned.
- 🩺 **Biomechanical Breakdown**: Joint-by-joint strength and safety cues personalized to your specific session performance.
- ✉️ **Automated Email Reports**: Send comprehensive post-session performance summaries directly to your inbox via SMTP.

### 🔐 5. Robust Authentication & Account Recovery
- 🔑 **Email OTP Verification**: 6-digit one-time passcodes sent directly to your inbox for secure signup confirmation.
- 🔄 **Self-Service Password Reset**: Dedicated password recovery modal with token validation and security strength indicators.
- 👤 **Health Profile & BMI Nutrition Planner**: Automatic BMI assessment with individualized dietary insights aligned with personal yoga goals.

### 📱 6. PWA & Responsive Mobile Experience
- 📲 **Progressive Web App (PWA)**: Installable on Desktop, iOS, and Android with custom offline caching and app manifests.
- 🗂️ **Mobile Slide-Over Drawer**: Responsive navigation drawer providing access to pose spectra, biomechanics features, settings, and profile sanctuary.

---

## 🎨 Design & Aesthetic Highlights

| Design Element | Choice | Purpose |
| :--- | :--- | :--- |
| **Primary Theme** | Emerald Sanctuary (`#064e3b`, `#10b981`) | Promotes calm, meditative focus, and wellness |
| **Accent Glow** | Warm Amber & Solar Gold (`#f59e0b`) | Highlights alignment targets and milestones |
| **Background** | Clean Off-White & Organic Stone (`#fafaf9`) | Eliminates visual clutter during physical movement |
| **Typography** | Serif Headings + Sans Interface | Balances traditional mindfulness with modern precision |
| **HUD Overlays** | Glassmorphic Translucent Panels | Keeps webcam vision unobstructed while practicing |

---

## 🏗 System Architecture

```text
 ┌──────────────────────────────────────────────────────────────────┐
 │                     User Web Browser (Client)                    │
 │                                                                  │
 │  ┌───────────────────────┐          ┌─────────────────────────┐  │
 │  │   Camera Stream /     │          │  Hands-Free Speech API  │  │
 │  │  Local Video Buffer   │          │  (Voice Commands Hook)  │  │
 │  └──────────┬────────────┘          └────────────┬────────────┘  │
 │             │ Volatile memory only               │               │
 │             ▼                                    ▼               │
 │  ┌────────────────────────────────────────────────────────────┐  │
 │  │      Yoga Biomechanics Engine (Trigonometric Scoring)      │  │
 │  │         • Joint Vector Angles   • Hold Duration Timers     │  │
 │  │         • Stability Detection   • Audio Speech Feedback    │  │
 │  └──────────────────────────┬─────────────────────────────────┘  │
 │                             │                                    │
 │  ┌──────────────────────────▼─────────────────────────────────┐  │
 │  │     Modular UI (PoseDrawer, ViewportHUD, SessionReport)    │  │
 │  └────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Modular Directory Structure

```text
├── index.html                            # Semantic HTML5 entry point & PWA metadata
├── vercel.json                           # SPA router configuration for Vercel production
├── public/
│   ├── _redirects                        # Universal SPA rewrites for static hosting
│   ├── manifest.json                     # Web App Manifest for mobile/desktop install
│   └── sw.js                             # Progressive Web App service worker
├── package.json                          # Project dependencies & scripts
├── metadata.json                         # AI Studio application metadata
├── src/
│   ├── main.tsx                          # React 19 application mount
│   ├── App.tsx                           # Master view coordinator & session routing
│   ├── types.ts                          # Strict TypeScript models & interfaces
│   ├── index.css                         # Tailwind CSS v4 styling rules
│   ├── components/
│   │   ├── Navbar.tsx                    # Header with slide-over mobile drawer & navigation
│   │   ├── HeroSection.tsx               # Studio hero & quick launch CTA
│   │   ├── LivePostureSession.tsx        # Live camera workspace & practice orchestrator
│   │   ├── ViewportHUD.tsx               # Live camera HUD, alignment ring & score overlay
│   │   ├── PoseDrawer.tsx                # Collapsible pose selector shelf & anatomy view
│   │   ├── PoseCarousel.tsx              # Interactive pose showcase with filters
│   │   ├── AutoRotatingPoseCarousel.tsx  # Hero animated pose display & card transitions
│   │   ├── FeatureColumns.tsx            # Biomechanics pillars & dual-control showcase
│   │   ├── PoseDetailModal.tsx           # Step-by-step entry guide & contraindications
│   │   ├── PreSessionOnboardingModal.tsx # Posture goals & experience questionnaire
│   │   ├── SessionReportModal.tsx        # Dynamic post-practice performance report
│   │   ├── UserProfileModal.tsx          # Health metrics, past sessions & BMI nutrition
│   │   ├── AuthModal.tsx                 # Account registration, 6-digit OTP & sign-in modal
│   │   ├── ResetPasswordModal.tsx        # Self-service password recovery modal
│   │   ├── BackendSettingsModal.tsx      # Settings modal for backend endpoints & cache reset
│   │   ├── PWAInstallButton.tsx          # In-app Progressive Web App install prompt
│   │   ├── AmbientAudioPlayer.tsx        # Ambient sound synthesizer controls
│   │   ├── AsanaSenseLogo.tsx            # SVG logo & brand identity
│   │   ├── PoseVisualArtwork.tsx         # Vector pose alignment artworks
│   │   ├── SessionLoadingTransition.tsx  # Smooth animated transition screens
│   │   ├── AppLoading.tsx                # Initial application loading indicator
│   │   ├── ErrorBoundary.tsx             # Studio runtime error protection fallback
│   │   └── Footer.tsx                    # Site directory, zero-storage promise & links
│   ├── hooks/
│   │   ├── usePoseLandmarker.ts          # Computer vision landmark tracking hook
│   │   ├── useVoiceController.ts         # Hands-free speech recognition hook
│   │   ├── useModalFocusTrap.ts          # Accessible keyboard focus trap for dialogs
│   │   └── usePWAInstall.ts              # Progressive Web App installation hook
│   ├── utils/
│   │   ├── ambientAudio.ts               # Web Audio API procedural sound engine
│   │   ├── audioFeedback.ts              # Spoken audio cues & synthesized sound effects
│   │   ├── apiClient.ts                  # Backend proxy, auth headers & WebSocket bridge
│   │   └── profileStorage.ts             # LocalStorage encrypted profile persistence
│   ├── data/
│   │   └── yogaPoses.ts                  # Master yoga database & biomechanical constraints
│   └── vite-env.d.ts                     # Vite client TypeScript definitions
```

---

## 🚀 Quick Start & Deployment

### Production URL
* 🌐 **Live Website**: [https://asana-sense-ai.vercel.app](https://asana-sense-ai.vercel.app)

### Local Development

1. **Clone or open the project folder**:
   ```bash
   cd asana-sense
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The studio opens instantly at `http://localhost:3000`.*

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🔒 Zero-Storage Privacy Commitment

* 🛡️ **In-Memory Camera Processing**: Video frames are analyzed frame-by-frame entirely inside volatile browser memory. 
* 🚫 **No Video Recording**: Your webcam stream and microphone input are **never saved, recorded, or uploaded** to external servers.
* 💾 **Local Data Ownership**: Practice history, preferences, and user profiles are stored securely in your browser storage.

---

<p align="center">
  Crafted with 🧘 for mindfulness, anatomical precision, and movement.
</p>

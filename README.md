# 🧘‍♀️ AsanaSense — AI-Powered Yoga Biomechanics & Real-Time Posture Coach

<p align="center">
  <img src="https://res.cloudinary.com/yhj7u0bn/image/upload/v1790602123/asana_sense_logo.png" alt="AsanaSense Logo" width="160" />
</p>

<p align="center">
  <a href="https://asana-sense-ai.vercel.app"><img src="https://img.shields.io/badge/Production-asana--sense--ai.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Live" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4.1-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" /></a>
  <a href="https://developers.google.com/mediapipe"><img src="https://img.shields.io/badge/MediaPipe-Pose_Landmarker-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="MediaPipe" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://web.dev/progressive-web-apps/"><img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" /></a>
</p>

<p align="center">
  <b>✨ In-browser pose tracking, backend posture analysis, hands-free voice control, and no video ever leaving your device. ✨</b>
</p>

---

## 🌈 Overview

**AsanaSense** is a privacy-conscious yoga posture evaluation and guidance web app. This repository is the **frontend**: a React 19 + TypeScript + Tailwind CSS v4 single-page app that runs the camera and pose tracking in the browser and talks to the ASANA-SENSE **FastAPI backend** for pose classification, joint-by-joint correctness, accounts, sessions, reports and SMTP email. Pose recognition uses the project's own trained ML classifier (TFLite); no generative AI model (such as Gemini) is involved.

* 🎯 **Live posture cues**: coloured skeleton (green / yellow / red per joint) and spoken corrections
* 🗣️ **Hands-free voice commands** using the browser Speech Recognition API
* 🎧 **Bring Your Own Audio**: AsanaSense ships no music or soundscapes. Add audio from your device (or a stream link) and play it during practice. Local files play directly in your browser and are never uploaded to any server. Your track list stays in your browser's local storage only.
* 📊 **Session analytics**: hold timers, personal bests, reports, 30-day progress trends
* 📱 **Installable PWA** with a responsive slide-over mobile drawer
* 🔐 **Accounts**: email OTP sign-up, password reset, Google and Microsoft sign-in
* 🛡️ **Video stays on your device**: only 33 body-joint coordinates are sent to the backend (see [Privacy](#-privacy--data-handling))

---

## ✨ Key Features

### 📷 1. Real-Time Vision & Posture Scoring
- ⚡ **In-browser skeletal tracking**: MediaPipe Pose Landmarker (Full model, WebAssembly, GPU delegate) finds 33 body landmarks on every frame. The render loop is capped at about 30 FPS.
- 🧠 **Backend analysis**: about 10–15 times per second the browser sends the 33 `[x, y]` landmark pairs over a WebSocket (`/ws/pose-detect`). The backend replies with the detected pose, confidence, a status for every joint (`correct`, `warning`, `critical`), a correction message and a hold-timer action.
- 🎯 **Interactive Viewport HUD**: alignment ring, accuracy pill, hold-duration counter and **personal-best** celebration for each pose.
- 🎨 **Colour-coded skeleton**: green, yellow and red joints and bones follow the backend result. Grey means no pose detected or a different pose than the selected one.
- 🔄 **Reference display toggle**: switch the reference between a photo and the vector artwork.
- 📷 Camera: front-facing, requested at 640×480.

### 🎤 2. Hands-Free Voice Assistant & Audio Guidance
- 🎙️ **Voice commands** (continuous recognition, `en-US`): select a pose (*"Select Tree"*, *"Go to Triangle"*, or just *"Tree pose"*), *"Next Pose"*, *"Previous Pose"*, *"Pause"*, *"Resume"*, *"Ready"* / *"Start"*, *"Analyze"*, *"Preview"*, open/close the poses drawer, camera on/off, scroll, open/close the voice-command table, and *"Finish session"*.
- 🔊 **Spoken corrections**: the backend's correction message is spoken once per change (for example when a joint turns red) while voice feedback is enabled.
- 🎵 **Personal audio player**: no audio is bundled with the app. Add your own tracks from your device or paste a stream URL, then play, pause and set the volume during practice. Local files are played in the browser and never uploaded. Only the track list is kept in `localStorage`, so after a page reload a local file may need to be added again.
- 🌐 Voice control needs **Chrome or Edge**. Firefox does not support the Speech Recognition API.

### 🧘‍♂️ 3. Interactive Pose Library & Anatomy Guide
Seven poses, each linked to a classifier output class:

| Pose | Sanskrit | Level | Category | Model class (index) |
|------|----------|-------|----------|---------------------|
| Chair Pose | Utkatasana | Beginner | Standing & Strength | `chair` (0) |
| Cobra Pose | Bhujangasana | Beginner | Backbend & Spine | `cobra` (1) |
| Downward-Facing Dog | Adho Mukha Svanasana | Beginner | Inversion & Core | `dog` (2) |
| Shoulder Stand | Sarvangasana | Advanced | Inversion & Core | `shoulder_stand` (4) |
| Triangle Pose | Trikonasana | Intermediate | Standing & Strength | `triangle` (5) |
| Tree Pose | Vrikshasana | Beginner | Standing & Balance | `tree` (6) |
| Warrior III | Virabhadrasana III | Intermediate | Balance & Core Strength | `warrior` (7) |

- 📖 Filter by Beginner, Intermediate and Advanced tiers.
- 🎨 Original vector artwork with alignment indicators and focus areas.
- 🔍 Pose detail modal: entry steps, contraindications, Sanskrit names, biomechanical targets.
- 🚶 The model's `no_pose` class (index 3) is internal and not shown in the library.

### 📊 4. Session Reports & Progress Trends
- 📈 **Session report**: generated from the poses practiced (backend `/api/generate-session-report`).
- ⏱️ **Hold-time analytics**: longest hold, average alignment score and **estimated** calories burned per session.
- 📉 **30-day progress trends**: Recharts chart of accuracy, minutes and consistency.
- ✉️ **Email report**: send the session summary to your inbox. The backend sends it over SMTP (`/api/send-session-report-email`).

### 🔐 5. Authentication & Account Management
- 🔑 **Email OTP**: 6-digit code emailed by the backend (SMTP) to confirm sign-up, with resend.
- 🔄 **Password recovery**: forgot-password email and a reset-password modal with token validation and strength indicator.
- 🌐 **Google and Microsoft sign-in**: via OAuth client IDs configured with environment variables.
- 👤 **Profile**: health details, BMI assessment with a nutrition plan, past sessions, welcome toast and welcome email.
- 🗑️ **Account deletion** and a **cookie consent** banner with preferences (including analytics telemetry).
- 📜 **Privacy, Terms and Disclaimer** modal.

### 📱 6. PWA & Responsive Experience
- 📲 **Installable** on desktop, iOS and Android. The manifest and service worker are **generated at build time** by `vite-plugin-pwa` (auto-update). Display mode `standalone`, portrait orientation, theme colour `#0c0a09`.
- 🗂️ **Offline scope**: the app shell (JS, CSS, HTML, images, fonts) is precached and Google Fonts are cached at runtime. Pose detection still needs internet because the MediaPipe WASM and model load from a CDN and analysis needs the backend.
- 🗂️ **Mobile slide-over drawer** for navigation, plus a notice modal that recommends desktop for best accuracy.

### 🛠️ 7. Backend Connectivity Tools
- ⚙️ **Backend Settings modal**: set the backend URL, run a health check and WebSocket handshake test, reset cached data.
- ♻️ **Auto-recovery**: the app polls `/api/health` when the free-tier backend is waking up, and the pose WebSocket reconnects with back-off (1, 2, 4, 8, then 10 seconds).

---

## 🎨 Design & Aesthetic Highlights

| Design Element | Choice | Purpose |
| :--- | :--- | :--- |
| **Primary Theme** | Emerald Sanctuary (`#064e3b`, `#10b981`) | Promotes calm, meditative focus, and wellness |
| **Accent Glow** | Warm Amber & Solar Gold (`#f59e0b`) | Highlights alignment targets and milestones |
| **Background** | Clean Off-White & Organic Stone (`#fafaf9`) | Eliminates visual clutter during physical movement |
| **PWA Theme** | Deep Stone (`#0c0a09`) | Splash screen and installed-app chrome |
| **Typography** | Playfair Display (serif headings) + Plus Jakarta Sans (interface), loaded from Google Fonts | Balances traditional mindfulness with modern precision |
| **HUD Overlays** | Glassmorphic Translucent Panels | Keeps webcam vision unobstructed while practicing |

---

## 🏗 System Architecture

```text
 ┌──────────────────────────────────────────────────────────────────┐
 │                     User Web Browser (this app)                  │
 │                                                                  │
 │  ┌───────────────────────┐          ┌─────────────────────────┐  │
 │  │  Webcam (getUserMedia)│          │ Web Speech Recognition  │  │
 │  │  frames stay in the   │          │ (voice commands hook)   │  │
 │  │  browser              │          └────────────┬────────────┘  │
 │  └──────────┬────────────┘                       │               │
 │             ▼                                    │               │
 │  ┌───────────────────────────┐                   │               │
 │  │ MediaPipe Pose Landmarker │                   │               │
 │  │ (WASM, Full model)        │                   │               │
 │  │ 33 landmarks / frame      │                   │               │
 │  └──────────┬────────────────┘                   │               │
 │             │ 33 × [x, y] only (no video)        │               │
 └─────────────┼────────────────────────────────────┼───────────────┘
               ▼ WebSocket /ws/pose-detect          │
 ┌─────────────────────────────────────┐            │
 │        FastAPI Backend (Render)     │            │
 │  • TFLite pose classifier (8 class) │            │
 │  • Joint-angle check vs reference   │            │
 │  • Auth, sessions, reports          │            │
 │  • SMTP email, data encryption      │            │
 └─────────────┬───────────────────────┘            │
               │ pose, confidence, joint status,    │
               │ correction message, timer action   │
               ▼                                    ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │  UI: ViewportHUD (coloured skeleton, score ring, hold timer),    │
 │  spoken corrections, PoseDrawer, SessionReport, Progress Trends  │
 └──────────────────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack

| Area | Technology (from `package.json`) |
| :--- | :--- |
| UI | React `^19.0.1`, React DOM, TypeScript `~5.8` |
| Build | Vite `^6.2`, `@vitejs/plugin-react`, `@tailwindcss/vite` |
| Styling | Tailwind CSS `^4.1` |
| Animation / icons / charts | `motion` `^12`, `lucide-react`, `recharts` `^3` |
| Pose vision | `@mediapipe/tasks-vision` `^0.10.35` |
| PWA | `vite-plugin-pwa` `^1.3` (Workbox) |
| Hosting | Vercel (SPA rewrite in `vercel.json`) |

---

## 📁 Modular Directory Structure

```text
├── index.html                            # HTML entry point, meta tags, icons, manifest link, Google Fonts
├── vercel.json                           # SPA rewrite: every route serves the app
├── vite.config.ts                        # Vite, Tailwind, PWA manifest/service worker, dev proxy
├── tsconfig.json                         # TypeScript config (path alias @/*)
├── package.json                          # Dependencies & scripts
├── metadata.json                         # AI Studio metadata (camera + microphone permission request)
├── public/                               # Static assets: favicon.png / .ico / .svg, icon.svg,
│                                         #   apple-touch-icon.png, pwa-192x192 / 512x512 / maskable icons
│                                         #   (manifest.webmanifest and the service worker are generated at build)
├── src/
│   ├── main.tsx                          # React 19 mount, service worker registration, error boundary
│   ├── App.tsx                           # Master view coordinator, routing, auth & session flow
│   ├── types.ts                          # TypeScript models & interfaces
│   ├── index.css                         # Tailwind v4 import & font theme
│   ├── vite-env.d.ts                     # Vite and PWA client type definitions
│   ├── components/
│   │   ├── Navbar.tsx                    # Header with slide-over mobile drawer
│   │   ├── HeroSection.tsx               # Hero & quick launch CTA
│   │   ├── LivePostureSession.tsx        # Live camera workspace & practice orchestrator
│   │   ├── ViewportHUD.tsx               # Alignment ring, score, hold timer, voice table
│   │   ├── PoseDrawer.tsx                # Collapsible pose selector shelf & anatomy view
│   │   ├── PoseCarousel.tsx              # Pose showcase with filters
│   │   ├── AutoRotatingPoseCarousel.tsx  # Hero animated pose display
│   │   ├── FeatureColumns.tsx            # Feature pillars showcase
│   │   ├── PoseDetailModal.tsx           # Entry steps & contraindications
│   │   ├── PoseVisualArtwork.tsx         # Vector pose artworks
│   │   ├── PreSessionOnboardingModal.tsx # Goals & experience questionnaire
│   │   ├── SessionReportModal.tsx        # Post-practice performance report
│   │   ├── ProgressTrendsChart.tsx       # 30-day progress chart (Recharts)
│   │   ├── UserProfileModal.tsx          # Health metrics, past sessions, BMI nutrition
│   │   ├── AuthModal.tsx                 # Sign-up with OTP, sign-in, OAuth buttons
│   │   ├── ResetPasswordModal.tsx        # Password recovery
│   │   ├── BackendSettingsModal.tsx      # Backend URL, health & WebSocket tests, cache reset
│   │   ├── CookieConsentBanner.tsx       # Cookie / analytics preferences
│   │   ├── PrivacyTermsModal.tsx         # Privacy, Terms, Disclaimer tabs
│   │   ├── MobileDesktopNoticeModal.tsx  # Mobile advisory notice
│   │   ├── WelcomeToast.tsx              # Post-login welcome message
│   │   ├── NotFoundPage.tsx              # 404 page
│   │   ├── PWAInstallButton.tsx          # In-app install prompt
│   │   ├── AmbientAudioPlayer.tsx        # Personal audio player (user-added local files or stream URLs)
│   │   ├── AsanaSenseLogo.tsx            # SVG logo
│   │   ├── SessionLoadingTransition.tsx  # Animated transition screens
│   │   ├── AppLoading.tsx                # Initial loading indicator
│   │   ├── ErrorBoundary.tsx             # Runtime error fallback
│   │   └── Footer.tsx                    # Site directory & links
│   ├── hooks/
│   │   ├── usePoseLandmarker.ts          # MediaPipe loading, frame loop, WebSocket, skeleton drawing
│   │   ├── useVoiceController.ts         # Hands-free speech command parser
│   │   ├── useModalFocusTrap.ts          # Keyboard focus trap for dialogs
│   │   └── usePWAInstall.ts              # PWA installation hook
│   ├── utils/
│   │   ├── apiClient.ts                  # HTTP client, auth token, WebSocket bridge, health checks
│   │   ├── oauthClient.ts                # Google & Microsoft sign-in helpers
│   │   ├── profileStorage.ts             # Profile & session storage (API first, localStorage fallback)
│   │   ├── progressAnalytics.ts          # 30-day trend aggregation
│   │   ├── audioFeedback.ts              # Spoken cues & sound effects
│   │   └── deviceDetection.ts            # Mobile detection helper
│   └── data/
│       └── yogaPoses.ts                  # Pose database (7 poses) & model class mapping
```

---

## 🚀 Quick Start & Deployment

### Production URL
* 🌐 **Live Website**: [https://asana-sense-ai.vercel.app](https://asana-sense-ai.vercel.app)

### Local Development

1. **Open the project folder** (Node.js 18 or newer):
   ```bash
   cd asana-sense
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the dev server**:
   ```bash
   npm run dev
   ```
   *Opens at `http://localhost:3000` (host `0.0.0.0`).*
4. **Production build and preview**:
   ```bash
   npm run build
   npm run preview
   ```
5. **Type check**:
   ```bash
   npm run lint
   ```
   *(runs `tsc --noEmit`)*

### Environment Variables (optional, `.env`)

| Variable | Used for |
| :--- | :--- |
| `VITE_API_BASE` | Backend base URL (a hosted URL; see note below) |
| `VITE_WS_BASE` | WebSocket target for the dev proxy only |
| `VITE_GOOGLE_CLIENT_ID` | Google sign-in |
| `VITE_MICROSOFT_CLIENT_ID` | Microsoft sign-in |
| `DISABLE_HMR` | Set to `true` to turn off hot reload (AI Studio) |

> [!NOTE]
> The default backend is `https://asana-sense-api.onrender.com`. The URL can also be changed in the in-app **Backend Settings** modal. Addresses containing `localhost`, `127.0.0.1` or `ngrok` are ignored by the client and replaced with the default hosted backend.

### Backend API used by the frontend

| Purpose | Routes |
| :--- | :--- |
| Health | `GET /api/health` |
| Auth | `/api/auth/send-otp`, `verify-otp`, `resend-otp`, `signin` (or `login`), `oauth-google`, `oauth-microsoft`, `forgot-password`, `reset-password`, `me`, `profile`, `account`, `send-welcome-email` |
| Poses and sessions | `/api/poses`, `/api/poses/{id}`, `/api/sessions`, `/api/sessions/{id}` |
| Reports | `/api/generate-session-report`, `/api/send-session-report-email` |
| Live analysis | WebSocket `/ws/pose-detect` |

### Deployment
Deployed on **Vercel**. `vercel.json` rewrites every path to the app so client-side routes such as `/reset-password` work.

---

## 🔒 Privacy & Data Handling

* 🛡️ **Video stays local**: camera frames are processed in the browser and are never recorded, saved or uploaded.
* 📤 **What is sent to the backend**: the 33 landmark coordinates (`x`, `y`) for live analysis, plus account data, practice sessions and profile details for signed-in users.
* 🔐 **Server side**: the backend encrypts stored data and sends all emails (OTP, password reset, welcome, reports) over SMTP.
* 💾 **Browser storage**: the login token, cached profile, cached sessions (last 30), cookie preferences and backend URL are kept in `localStorage`. They are **not encrypted**; use **Backend Settings** or sign out to clear them.
* 🌐 **Third-party loads**: the MediaPipe WASM files load from jsDelivr, the pose model from Google storage, and fonts from Google Fonts.
* 🎤 **Voice commands**: handled by the browser's Speech Recognition API. In Chrome this may send audio to the browser vendor's speech service, so refer to your browser's policy.

---

## ⚠️ Known Limitations & Notes

> [!CAUTION]
> - **Backend required**: pose analysis, accounts and reports need the FastAPI backend. The free-tier host may take time to wake up (the app shows a status and keeps retrying).
> - **Local backend not supported by the client**: the API client replaces `localhost`, `127.0.0.1` and `ngrok` URLs with the hosted backend, so the dev-server proxy in `vite.config.ts` is not used for API calls.
> - **Model variant mismatch**: the frontend runs `pose_landmarker_full`; the classifier in the ML folder was trained on landmarks from `pose_landmarker_heavy`. Re-test live accuracy or match the variants.
> - **WASM version**: `@mediapipe/tasks-vision` is pinned to `^0.10.35` in `package.json`, but the WASM files load from `@latest` on the CDN. Pin the CDN URL to the same version to avoid breakage.
> - **Not offline-capable for analysis**: only the app shell is cached (see PWA section).
> - **TypeScript is not in strict mode** (`strict` is not set in `tsconfig.json`).
> - **Calories are estimates**, not clinical values. Nutrition and BMI tips are general guidance.
> - **Unused fonts**: `index.html` also loads Inconsolata and Space Mono, but `index.css` only sets the serif and sans fonts, so monospace text uses the default stack. Remove the two families to save a download.
> - **Lighting and framing**: keep your full body in frame with good lighting for best accuracy.

---

<p align="center">
  Crafted with 🧘 for mindfulness, anatomical precision, and movement.
</p>
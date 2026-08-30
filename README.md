# 🧘‍♀️ AsanaSense (Veda AI) — AI-Powered Yoga Biomechanics & Posture Coach

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini 2.5](https://img.shields.io/badge/Google_Gemini-2.5-8E75FF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Express Backend](https://img.shields.io/badge/Express-Backend-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

> **Elevate your yoga practice with real-time AI vision analysis, voice feedback, biomechanical alignment scoring, and personalized wellness insights.**

---

## 🌈 Overview

**AsanaSense** (powered by Veda AI Engine) is a full-stack, AI-integrated yoga posture feedback platform. Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Google Gemini AI**, AsanaSense provides yoga practitioners with instantaneous pose alignment cues, joint angle analysis, audio feedback, and post-practice analytics—all directly within the browser with privacy-first camera processing.

---

## ✨ Key Features

### 📷 1. Real-Time Vision & Biomechanics Correction
- ⚡ **AI Pose Analysis**: Real-time alignment checks using server-side **Google Gemini AI** vision models.
- 📐 **Joint Angle & Keypoint Detection**: Evaluates spine alignment, hip opening, shoulder positioning, and weight distribution.
- 🎯 **Visual Target Overlays**: Live canvas drawing with color-coded posture target vectors and corrective guidance.

### 🎤 2. Hands-Free Voice Control & Audio Guidance
- 🗣️ **Voice Command Recognition**: Control your session hands-free ("Start practice", "Next pose", "Pause session", "Help").
- 🔊 **Voice Cues & Spoken Feedback**: Speech synthesis alerts you when hips need leveling or shoulders need relaxation.
- 🎵 **Ambient Synthesizer & Calming Audio**: Integrated soft ambient soundscape and sound effects to help maintain meditative focus.

### 🧘‍♂️ 3. Interactive Pose Library & Dynamic Vector Art
- 📖 **Extensive Pose Catalog**: Filterable by difficulty (*Beginner*, *Intermediate*, *Advanced*) and target benefit (*Balance*, *Flexibility*, *Core Strength*, *Restorative*).
- 🎨 **Pose Visual Artwork**: Crisp vector visual representations showcasing proper target form and alignment cues.
- 🔍 **Detailed Pose Inspection**: Step-by-step entry/exit guides, contraindications, and anatomical benefits.

### 📊 4. Posture Reports & Session Analytics
- 📈 **Accuracy Breakdown**: Post-session analytics tracking overall posture score, stability rating, duration, and calories burned.
- 📋 **Personalized Improvements**: Actionable posture adjustment tips generated specifically for your session performance.

### 🥗 5. Personal Health Profile & BMI Diet Planner
- 👤 **Custom Health Goals**: Track your practice intensity preferences, flexibility targets, and experience levels.
- ⚖️ **BMI Calculator & Meal Suggestions**: Calculates body metrics and suggests complementary dietary recommendations for holistic wellness.

---

## 🎨 Design & Aesthetic Highlights

- **Palette**: Deep Emerald (`#064e3b`), Sage Accent (`#10b981`), Warm Sand (`#fdfbf7`), and Subtle Amber Gold.
- **Typography**: Paired with modern display fonts and high-legibility interface type.
- **Fluid Micro-Interactions**: Smooth modal transitions, dynamic skeleton placeholders, and animated pose carousels powered by `motion/react`.

---

## 🏗 Architecture & Tech Stack

```
                     ┌─────────────────────────────────────────┐
                     │          AsanaSense Frontend            │
                     │  (React 19 + TypeScript + Tailwind v4)  │
                     └────────────────────┬────────────────────┘
                                          │
                                 API Proxy Requests
                                          │
                     ┌────────────────────▼────────────────────┐
                     │           Node / Express Server         │
                     │             (server.ts / tsx)           │
                     └────────────────────┬────────────────────┘
                                          │
                             Secure @google/genai SDK
                                          │
                     ┌────────────────────▼────────────────────┐
                     │          Google Gemini 2.5 AI           │
                     │      (Biomechanics & Vision Model)      │
                     └─────────────────────────────────────────┘
```

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 6 | Modern, lightning-fast SPA with reactive state |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive, dark/light balanced theme |
| **Animations** | Motion (`motion/react`) | Fluid transitions and carousel interactions |
| **Icons** | Lucide React | Clean, consistent vector icons |
| **Backend Engine** | Express + `tsx` | Node server proxying AI vision calls securely |
| **AI Integration** | `@google/genai` | Server-side Gemini API SDK for posture biomechanics |

---

## 📁 Directory Structure

```text
├── server.ts                           # Express backend server (Gemini proxy & API routes)
├── index.html                          # Main HTML entry point
├── package.json                        # Dependencies & NPM scripts
├── metadata.json                       # AI Studio Applet configuration
├── src/
│   ├── main.tsx                        # Application mount point
│   ├── App.tsx                         # Primary view controller & navigation logic
│   ├── types.ts                        # TypeScript models (User, Pose, Session, Report)
│   ├── components/
│   │   ├── Navbar.tsx                  # Top navigation & user controls
│   │   ├── HeroSection.tsx             # Interactive header & CTA
│   │   ├── LivePostureSession.tsx      # Real-time camera & AI feedback canvas
│   │   ├── PoseCarousel.tsx            # Filterable pose slider
│   │   ├── PoseDetailModal.tsx         # Deep dive into posture mechanics
│   │   ├── PreSessionOnboardingModal.tsx# Health & posture questionnaire
│   │   ├── SessionReportModal.tsx      # Practice summary & pose score metrics
│   │   ├── UserProfileModal.tsx        # Profile management & BMI nutrition planner
│   │   ├── AsanaSenseLogo.tsx          # Brand identity component
│   │   ├── PoseVisualArtwork.tsx       # Dynamic pose vector graphics
│   │   └── Footer.tsx                  # Application footer & navigation links
│   ├── hooks/
│   │   └── useVoiceController.ts       # Hands-free speech recognition hook
│   ├── utils/
│   │   ├── ambientAudio.ts             # Web Audio API ambient synthesizer
│   │   ├── audioFeedback.ts            # Speech synthesis & sound cues
│   │   └── profileStorage.ts           # Local storage persistence helper
│   └── data/
│       └── yogaPoses.ts                # Master yoga pose library database
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v18+` or `v20+`
- NPM `v9+` or Yarn / PNPM

### Installation

1. **Clone or navigate to the repository directory**:
   ```bash
   cd asana-sense
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *The application runs on `http://localhost:3000`.*

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🔒 Security & Privacy

- 🛡️ **Client-Side Camera Stream**: Video frames are processed locally for real-time overlay and only key biometric landmarks or frame samples are sent through secure server-side API routes.
- 🔐 **Server-Side API Keys**: Google Gemini API keys remain strictly on the Express backend (`server.ts`) and are never exposed to the client browser.

---

## 📜 License

Distributed under the **Apache-2.0 License**. See `LICENSE` for details.

<p align="center">
  Crafted with 🧘 for mindfulness & movement powered by <b>Google AI Studio</b>.
</p>

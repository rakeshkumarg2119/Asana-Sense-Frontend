# Mobile Responsive Live Session Architecture & UI Design

A mobile-first redesign for the Veda AI Live Posture Session, transforming the live yoga experience on smartphones and tablets into an ergonomic, stacked layout with one-tap camera flipping, high-visibility guidance cards for distance viewing, and responsive thumb-friendly controls.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your responses, the mobile live session experience is tailored to your exact specifications:
> 1. **Stacked Mobile Hierarchy**: Live camera feed pinned on top (`h-[44vh]` / `aspect-[4/3]`) with real-time pose guidance and controls stacked directly below, eliminating desktop split squeeze.
> 2. **One-Tap Camera Flip**: A dedicated toggle button to flip between front (self-facing, mirrored) and rear (environment-facing, unmirrored) cameras so you can prop up your phone against a wall or mat.
> 3. **Distance-Friendly Coaching**: Enlarged text cards with bold contrast typography paired with voice coaching cues so you can read and hear posture corrections from 6–10 feet away.
> 4. **Mobile Bottom Sheet for 8 Poses**: On mobile devices, the 8 Poses shelf opens as a smooth, thumb-friendly slide-up bottom sheet with clear lock/unlock badges and quick selection.

---

## 1. Overview & Core Concept

### What It Does
Adapts the full real-time computer vision live posture analysis engine for mobile phone and tablet form factors (375px to 768px). It replaces the wide desktop side-by-side workspace with a mobile-optimized stacked viewport:
* **Top Screen Zone**: Live webcam feed with joint skeleton landmarks, hold streak circular timer ring, and flip camera toggle.
* **Middle Screen Zone**: Enlarged high-contrast coaching card displaying real-time joint feedback (green/amber/red indicators) and actionable corrections.
* **Bottom Thumb Zone**: Quick-access touch targets ($\ge 44\text{px}$) for "Turn On Camera" / "I'm Ready", pose shelf drawer, ambient soundscapes, voice toggle, and next/prev progression.

### Target Audience & Persona
Yogis practicing at home or in studios using a smartphone propped on the floor, yoga block, or stand, needing clear visual and audio cues without squinting or straining.

### Key Value
Frictionless mobile access to AI vision yoga coaching without layout breakage, clipped dialogs, or inaccessible controls.

---

## 2. User Experience & Visual Design

### Key User Flows

#### A. Mobile Entry & Camera Setup
1. User taps **Practice with AI Vision Feedback** on any pose card from mobile.
2. The Live Session launches with a compact mobile top bar showing the active pose name, advisory info icon, voice toggle, and exit button.
3. The greeting stage displays the pose visual and clear steps: **Turn On Camera** (prominent green button) $\rightarrow$ step back into frame $\rightarrow$ tap **I'm Ready**.
4. A **Camera Flip** button lets users immediately switch between selfie and environment cameras.

#### B. During Practice (Distance-Optimized Coaching)
1. User steps back onto their mat.
2. Camera feed remains centered and steady at the top of the viewport.
3. When the user enters the pose, the AI vision WebSocket detects landmarks:
   - Green joint highlights for correct alignment.
   - Red joint markers for misalignments with clear corrective arrows.
4. Directly below the camera, the **Enlarged Coaching Card** updates in real-time with high-contrast text:
   - Status badge: *"Holding Pose (Adjusting 🟡)"* or *"All Joints Correct 🟢"*.
   - Plain-English actionable cue: e.g., *"👉 Straighten your right knee and lower hips slightly."*
   - Spoken audio coaching chimes in via speech synthesis.

#### C. Mobile 8-Pose Drawer / Bottom Sheet
1. Tapping **Poses (8)** on mobile slides up an ergonomic bottom sheet overlay with a drag handle.
2. User can scroll through the 8 curated poses, review locked status for guest mode, and switch poses with a single tap.
3. Tapping a pose selects it and smoothly dismisses the sheet back to the camera stage.

---

### Visual Identity & Theme Tokens

* **Background Canvas**: Deep organic obsidian (`#0c0a09` / `bg-stone-950`) with subtle emerald atmospheric tint.
* **Surfaces**: `bg-stone-900/95` and `bg-stone-950/90` with hairline borders (`border-stone-800`), backdrop blur (`backdrop-blur-md`), and `rounded-2xl` / `rounded-3xl` radii.
* **Accents**: 
  - Emerald (`#10b981`, `bg-emerald-600`) for correct alignment and primary CTAs.
  - Amber (`#f59e0b`, `bg-amber-500/20`) for warnings, guest locked states, and dietary advisories.
  - Coral Red (`#ef4444`) for critical alignment adjustments.
* **Typography**:
  - Headers: Playfair Display / Serif for serene yoga mood.
  - UI & Guidance: Plus Jakarta Sans / Inter with enlarged body text (`text-sm sm:text-base font-semibold`) for mobile legibility.
  - Metrics & Timers: Monospace tabular numerals (`font-mono tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Mobile Layout Structure** | Stacked (Camera top, Coaching bottom) | Matches natural vertical phone holding and propped viewing; camera remains visible while coaching text sits in direct line of sight. | Side-by-side split (too cramped on 375px screens); Fullscreen camera with floating sheet (blocks video landmarks). |
| **Camera Facing Mode** | Front default + One-Tap Flip Toggle | Yogis often prop phones against a wall where rear camera has better lenses and wider FOV; toggle gives instant freedom. | Front-only (restricts users with propped stands); Modal camera picker (too many taps). |
| **Mirroring Behavior** | Mirror for Front (`-scale-x-100`), Unmirrored for Rear (`scale-x-100`) | Standard intuitive webcam behavior for selfie mode, natural orientation for rear environment camera. | Always mirror (confusing when using rear camera). |
| **Pose Drawer on Mobile** | Slide-up Bottom Sheet with backdrop blur | Follows mobile design constitution; accessible in natural thumb reach zone without shifting camera geometry. | Pinned sidebar (breaks aspect ratio on phones). |
| **Touch Target Sizing** | $\ge 44 \times 44\text{px}$ across all mobile buttons | Meets WCAG and Mobile Design Constitution requirements, preventing missed taps during physical movement. | Compact desktop-sized 28px buttons (hard to tap while standing). |

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Mobile Live Session                   │
├────────────────────────────────────────────────────────┤
│  Top Bar: [Exit] [Pose Badge] [Voice] [Advisory] [Done]│
├────────────────────────────────────────────────────────┤
│                                                        │
│  Camera Viewport (Top 42-46vh / Aspect 4:3)            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Video + Skeleton Canvas (Mirrored or Normal)     │  │
│  │ Top Overlay: [Flip Camera] [Hold Timer Circle]   │  │
│  │ Center Overlay: [Turn On Camera] / [I'm Ready]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Stacked Coaching Feedback (High Contrast)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Veda AI Guidance • Status: All Joints Correct 🟢 │  │
│  │ "👉 Keep your chest lifted and breathe deeply"   │  │
│  │ Audio Cues: Voice Synthesis active               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Mobile Action Bar (Thumb Zone)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Flip Cam] [Audio] [Poses (8)] [Prev] [Next]     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                           │
             Tapping [Poses (8)] on Mobile
                           ▼
┌────────────────────────────────────────────────────────┐
│  Mobile Slide-Up Bottom Sheet (Z-50)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [─ Drag Handle ─]                                │  │
│  │ 8 Curated Asanas Grid with Free/Locked status    │  │
│  │ Single-tap selection with instant camera switch  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Component & State Mapping

1. **`facingMode` State**:
   - `'user' | 'environment'` state in `LivePostureSession.tsx`.
   - `handleToggleCameraFacing()`: stops existing tracks, switches `facingMode`, requests new `getUserMedia({ video: { facingMode } })`, and updates video/canvas mirroring classes.
2. **Responsive Layout Containers**:
   - Replace fixed `min-h-[700px] overflow-hidden` with `lg:overflow-hidden overflow-y-auto flex-col lg:flex-row`.
   - Set mobile camera stage height to `h-[42vh] sm:h-[48vh] lg:h-full min-h-[300px]`.
3. **Mobile Pose Drawer / Bottom Sheet**:
   - Detect screen width or use Tailwind classes (`fixed inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl lg:relative lg:inset-auto lg:rounded-3xl`).
   - Smooth animation with Framer Motion slide-up.
4. **Enlarged Distance Feedback Card**:
   - Prominent font size (`text-sm sm:text-base font-bold`) and vibrant contrast badges (`text-emerald-300`, `text-amber-300`).
   - Clear visual icons and unboxed status separators.

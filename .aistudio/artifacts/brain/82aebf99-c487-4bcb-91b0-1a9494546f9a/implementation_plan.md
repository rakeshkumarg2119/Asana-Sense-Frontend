# Implementation Plan: Guest Access Guidance, Email Report Auth Trigger, Two-Step Camera Readiness, and Hold Timer Precision

Enhance guest studio accessibility, streamline report email account creation, decouple camera activation from readiness, and ensure the hold timer strictly requires bodily presence and correct posture alignment.

---

## User Review Required

> [!IMPORTANT]
> **Guest Locked Pose Experience**: When a guest initiates a session with a locked pose from the Curated Posture Spectrum, they will enter the studio smoothly. The studio stage will display a polite advisory explaining that the pose is reserved for registered accounts, prompting them with a small message and left arrow (`←`) to select one of the 3 free poses from the shelf or sign in to unlock all 7 postures.
> **Two-Step Camera & Ready Controls**: "Turn On Camera" will be an independent action that activates video streaming without starting timers. "I'm Ready" will be a separate secondary action that begins active posture monitoring.
> **Strict Hold Timer**: The pose hold timer will pause and refuse to increment unless the AI vision model confirms that a human is detected in frame (`pose_detected: true`) and the recognized posture matches the selected asana (`isPoseMatch: true`).

---

## Proposed Changes

### 1. Curated Posture Spectrum & Guest Session Initiation
#### Files: `src/App.tsx`, `src/components/PoseCarousel.tsx`
- In `App.tsx` (`handleInitiateSession`): Allow guests to enter the live session with any selected pose instead of abruptly blocking them at the homepage.
- Pass the selected pose ID into `LivePostureSession` as the initial pose.
- Ensure guests who click "Practice with AI Vision Feedback" transition into the live studio experience seamlessly.

---

### 2. Live Studio Guest Guidance for Locked Poses
#### Files: `src/components/LivePostureSession.tsx`, `src/components/ViewportHUD.tsx`
- Detect when a practitioner is in Guest Mode (`!userProfile`) and has selected a locked pose (`!['dog', 'warrior', 'tree'].includes(currentPose.id)`).
- On the live studio stage greeting card and Viewport HUD:
  - Display a polite guidance box:
    > *"You are currently practicing in Guest Mode. [Pose Name] is reserved for registered practitioners. Feel free to explore our 3 free poses (Downward Dog, Warrior II, Tree Pose), or create a free account to unlock the entire sequence."*
  - Add small text with a left arrow indicator (`← Select free poses in shelf or Sign Up`) pointing to the shelf drawer and authentication options.
  - Disable the "I'm Ready" monitoring trigger on locked poses for guests with a clean "Unlock Pose via Free Sign Up" action button.

---

### 3. Immediate Auth Modal on Session Report "Email Report" Click
#### File: `src/components/SessionReportModal.tsx`
- In `handleSendBackendEmail`: When a guest practitioner (no `userProfile?.email`) clicks **"Email Report"**, immediately invoke `onOpenAuth?.()` to open the Sign In / Sign Up modal card overlay.
- Keep the session report state intact in the background so once signed in or signed up, the user can immediately dispatch their certified report to their newly created account email.

---

### 4. Decouple "Turn On Camera" and "I'm Ready" Controls
#### Files: `src/components/LivePostureSession.tsx`, `src/components/ViewportHUD.tsx`
- Separate the current combined action into two distinct sequential buttons across both the center Viewport HUD card and the bottom Action Bar:
  1. **Button 1: "Turn On Camera"** (`startCamera`): Initializes webcam stream, calibrates lighting, and confirms video feed without starting any posture timer or hold streak.
  2. **Button 2: "I'm Ready"** (`handleConfirmReadyAndStart`): Only enabled when camera is live. Begins pose hold tracking and AI skeletal monitoring.
- Clearly update button copy, icons (`Camera` vs `Play`), and status labels to avoid any ambiguity.

---

### 5. Precision Hold Timer Logic
#### File: `src/components/LivePostureSession.tsx`
- Audit and harden the hold timer `setInterval` logic (lines 775–865):
  - Previously, when `modelPoseResult` was `null` (such as before websocket frames returned or when nobody was standing in front of the camera), the timer would fall through and increment every second automatically.
  - Refactor condition:
    ```ts
    const currentResult = modelPoseResultRef.current;
    // Strict Guard: Must have an active detection result with a human body present
    if (!currentResult || !currentResult.pose_detected) {
      return; // Do NOT increment hold timer
    }
    // Strict Guard: Must match the currently selected pose
    if (currentResult.pose_mismatch || !isPoseMatch(currentResult.pose_name, pose.id)) {
      return; // Do NOT increment hold timer
    }
    // Strict Guard: Must not have critical red misalignment
    if (hasRedJoint) {
      handleStreakBreak(currentHold);
      return;
    }
    // Only increment when body is present, pose matches, and form is aligned
    ```
- This guarantees the hold timer will never run endlessly while the user is absent, stepping into frame, or performing an incorrect pose.

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to verify clean TypeScript compilation with zero type errors.
- Run `lint_applet` to ensure codebase passes strict lint checks (`tsc --noEmit`).

### Functional Verification
1. **Curated Posture Spectrum Guest Practice**:
   - As a guest, select Chair Pose (locked pose) in the Curated Posture Spectrum and click "Practice with AI Vision Feedback".
   - Verify it launches into Live Posture Session without blocking.
   - Verify the studio stage displays the polite guest locked pose advisory with the left arrow guidance pointing to free poses or sign-up.
2. **Email Report Modal**:
   - Complete a session or trigger a report as a guest. Click "Email Report" in the footer.
   - Verify the Sign In / Sign Up modal card opens immediately.
3. **Two-Step Camera & Ready Controls**:
   - In Live Session, verify "Turn On Camera" and "I'm Ready" are separate buttons.
   - Click "Turn On Camera". Verify camera starts, but the hold timer stays at 0s and does not count down or tick.
   - Click "I'm Ready". Verify posture monitoring activates.
4. **Hold Timer Presence**:
   - Turn on camera and click "I'm Ready" while stepping away from camera frame.
   - Verify the hold timer does NOT tick up and stays at 0s.
   - Step into frame and perform the matching pose: verify the hold timer increments smoothly.

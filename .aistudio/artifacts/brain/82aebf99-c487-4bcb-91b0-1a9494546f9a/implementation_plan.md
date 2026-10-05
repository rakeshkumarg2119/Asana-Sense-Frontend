# Mobile Hamburger Slide-Over Navigation Drawer Plan

Implement a responsive, accessible **Mobile Hamburger Navigation Menu** that slides out smoothly from the right with backdrop blur on mobile devices ($< 768\text{px}$), consolidating all navigation links, backend/Ngrok configuration, and authentication actions while keeping desktop navigation intact.

---

### User Review & Critical Decisions

- **Confirmed Decision (Drawer Style)**: Smooth slide-over side drawer from the right with backdrop blur (`backdrop-blur-md bg-stone-950/70`).
- **Confirmed Decision (Signed-In User Profile)**: User profile avatar button remains in the top navbar for quick access, with full profile, stats, and settings links also mirrored inside the mobile drawer.
- **Confirmed Decision (Mobile Item Consolidation)**: The mobile drawer contains:
  1. **Navigation Links**: Pose Spectrum, Features & Biomechanics, Zero-Storage Promise.
  2. **System & Backend**: Python Backend / Ngrok Bridge configuration status button.
  3. **Authentication**: Sign In and Sign Up buttons (or user profile card + quick vault link when signed in).
  4. **PWA Install Button**: Embedded conveniently within the drawer as well.

---

### 1. Overview & Visual Design

- **Mobile Top Bar**:
  - Left: AsanaSense Logo (`size="sm"` or `"md"`).
  - Right: Quick user profile avatar (if logged in) + Hamburger Menu Toggle button (`Menu` / `X` with active animation and $\ge 44\text{px}$ touch target).
- **Slide-Over Drawer (`motion.div` from right: `x: '100%'` $\to$ `x: 0`)**:
  - **Header**: AsanaSense mini brand emblem + Close button (`X`).
  - **Navigation Section**:
    - 🌸 *Pose Spectrum* (scrolls to `#pose-carousel-showcase` and closes drawer).
    - 🧬 *Features & Biomechanics* (scrolls to `#features-section` and closes drawer).
    - 🛡️ *Zero-Storage Promise* (scrolls to `#privacy-assurance-promise-banner` and closes drawer).
  - **Backend / Ngrok Bridge Card**: Shows live connection pill (Ngrok / Backend status indicator) and opens settings modal.
  - **Auth & Account Footer**:
    - If logged out: Prominent *Sign In* and *Sign Up* buttons.
    - If logged in: User avatar card with display name, email, and *View Sanctuary Vault & Profile* button.

---

### 2. Accessibility & Interaction Details

- Keyboard Escape key closes the drawer immediately.
- Traps focus while open, preventing scroll bleed on `document.body` (`overflow: hidden`).
- Click on backdrop overlay dismisses the drawer smoothly.
- All links and buttons meet WCAG AA touch target requirements ($\ge 44\text{px}$).

---

### 3. Proposed Component Changes

```
┌─────────────────────────────────────────────────────────────┐
│                          Navbar.tsx                         │
│                                                             │
│  [Logo]                       [Avatar (if auth)] [☰ Hamburger]│
│                                                             │
│   (When clicked on mobile:)                                 │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ Backdrop (stone-950/75 blur)                          │ │
│   │                     ┌───────────────────────────────┐ │ │
│   │                     │ Mobile Drawer (Slide from R)  │ │ │
│   │                     │ • Brand Header & [X] Close    │ │ │
│   │                     │ • Navigation Links            │ │ │
│   │                     │   - Pose Spectrum             │ │ │
│   │                     │   - Features & Biomechanics   │ │ │
│   │                     │   - Zero-Storage Promise      │ │ │
│   │                     │ • Backend / Ngrok Button      │ │ │
│   │                     │ • PWA Install Action          │ │ │
│   │                     │ • Auth (Sign In / Sign Up /   │ │ │
│   │                     │   Profile Management)         │ │ │
│   │                     └───────────────────────────────┘ │ │
│   └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Files to Update:
1. **`src/components/Navbar.tsx`**:
   - Add mobile drawer state (`mobileMenuOpen`), hamburger toggle button (`md:hidden`), and full `AnimatePresence` slide-over drawer implementation.
   - Hide individual desktop nav links, desktop Ngrok badge, and desktop Auth button cluster on small screens (`hidden md:flex`).

---

### 4. Verification & Testing

- Run `lint_applet` and `compile_applet`.
- Test drawer open/close animation, Escape key, overlay click, and navigation scroll links.
- Test both signed-out and signed-in mobile layouts.

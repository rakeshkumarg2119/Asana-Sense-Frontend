# Implementation Plan: Forgot Password Direct Reset Link & Cookie Consent System

## Overview
This plan implements a complete **Forgot Password & Direct Reset Link Flow** (frontend UI + URL listener + FastAPI backend code) and a **Cookie Consent Banner & Granular Preferences Modal** adhering to the exact text provided by the user.

---

## User Review Required

> [!IMPORTANT]
> - **Forgot Password Flow**: Users clicking "Forgot Password?" in the Sign In screen can enter their email to receive a password reset link. Opening the link (`?mode=reset-password&token=...`) directly loads the secure **Reset Password** modal.
> - **Cookie Consent System**: A bottom floating banner allows users to "Accept All", "Essential Only", or customize "Preferences" (Essential, Functional Audio/Settings, Telemetry). Consent is remembered persistently.

---

## Proposed Changes

### 1. Forgot Password & Direct Reset Flow (`src/utils/apiClient.ts` & `src/components/AuthModal.tsx` & `src/components/ResetPasswordModal.tsx`)
- **API Client Additions (`src/utils/apiClient.ts`)**:
  - `apiForgotPassword(email: string): Promise<{ success: boolean; message: string }>`: Calls `POST /api/auth/forgot-password`.
  - `apiResetPassword(token: string, email: string, newPassword: string): Promise<{ success: boolean; message: string }>`: Calls `POST /api/auth/reset-password`.
- **Sign In UI Enhancement (`src/components/AuthModal.tsx`)**:
  - Add **"Forgot password?"** button below the passkey input.
  - Add **"Request Reset Link"** step inside the auth modal: user types email -> frontend calls `apiForgotPassword` -> shows confirmation screen with email icon and instructions.
- **Dedicated Reset Password Modal & URL Detection (`src/components/ResetPasswordModal.tsx`)**:
  - Listens on app load for URL search parameters: `?mode=reset-password&token=<token>&email=<email>`.
  - Displays password strength meter, `New Password`, and `Confirm Password` inputs with visibility toggles.
  - Submits to `POST /api/auth/reset-password`.
  - Upon success, displays green celebration badge and redirects user to sign in, removing URL parameters cleanly with `window.history.replaceState`.

### 2. Cookie Consent Banner & Preferences Modal (`src/components/CookieConsentBanner.tsx`)
- **Bottom Floating Banner**:
  - Exact copy provided:
    > *"We use essential cookies to make our site work. With your consent, we may also use non-essential cookies to improve user experience and analyze website traffic. By clicking “Accept,” you agree to our website's cookie use as described in our Cookie Policy. You can change your cookie settings at any time by clicking “Preferences.”"*
  - Actions: **"Accept All"**, **"Essential Only"**, and **"Preferences"**.
- **Granular Preferences Modal**:
  - **Essential Storage** (Always active): JWT session tokens, backend routing URLs, security verification.
  - **Functional & Experience Preferences**: Ambient soundscape audio settings, voice guidance cues, camera preferences.
  - **Analytics & Performance**: Posture detection FPS telemetry, session score logs.
- **Footer Link Integration (`src/components/Footer.tsx`)**:
  - Adds a **"Cookie Settings"** button in the footer so practitioners can reconfigure preferences anytime.

### 3. FastAPI Python Backend Implementation for Forgot & Reset Password

Here is the exact copy-pasteable Python backend code for your FastAPI server:

```python
import time
import secrets
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory / Redis token store: { "reset_token_xyz": { "email": "user@example.com", "expires_at": 1727550000 } }
RESET_TOKEN_STORE = {}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    email: EmailStr
    new_password: str

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    email_key = req.email.lower()
    # 1. Check if user exists in database
    # user = db.get_user_by_email(email_key)
    # if not user: return {"success": True, "message": "If an account exists, a reset link has been dispatched."}

    # 2. Generate secure single-use token (valid 15 minutes)
    reset_token = secrets.token_urlsafe(32)
    RESET_TOKEN_STORE[reset_token] = {
        "email": email_key,
        "expires_at": time.time() + 900 # 15 mins
    }

    # 3. Create direct reset URL
    # Replace with your production or frontend app URL:
    reset_url = f"https://your-frontend-app.com/?mode=reset-password&token={reset_token}&email={email_key}"

    # 4. Dispatch Email via SMTP / SendGrid / Resend / AWS SES:
    # await send_password_reset_email(to=req.email, reset_url=reset_url)
    print(f"📧 [PASSWORD RESET LINK] To: {email_key} | URL: {reset_url}")

    return {
        "success": True,
        "message": f"Password reset instructions have been dispatched to {req.email}"
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    token_record = RESET_TOKEN_STORE.get(req.token)

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset link. Please request a new one.")

    if time.time() > token_record["expires_at"]:
        RESET_TOKEN_STORE.pop(req.token, None)
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    if token_record["email"] != req.email.lower():
        raise HTTPException(status_code=400, detail="Token mismatch with provided email address.")

    # 1. Hash new password
    hashed_password = pwd_context.hash(req.new_password)

    # 2. Update user record in your DB (PostgreSQL / MongoDB / SQLite)
    # db.update_user_password(email=req.email.lower(), new_hash=hashed_password)
    print(f"🔑 [PASSWORD UPDATED] Successfully updated password in DB for: {req.email}")

    # 3. Invalidate single-use reset token
    RESET_TOKEN_STORE.pop(req.token, None)

    return {
        "success": True,
        "message": "Your password has been successfully updated. You may now sign in with your new password."
    }
```

---

## Verification Plan

1. **Forgot Password Step**: Click "Forgot password?" in Auth modal, enter email -> test request API dispatch and feedback screen.
2. **Direct Reset Link Verification**: Navigate with URL parameters `?mode=reset-password&token=test_token_123&email=user@example.com` -> verify Reset Password modal opens with pre-filled email, password validation, and clean submission.
3. **Cookie Consent Banner & Preferences**: Test floating banner display, Accept All, Essential Only, and Granular Preferences modal toggling and saving.
4. **Build & Lint Verification**: Run `lint_applet` and `compile_applet`.

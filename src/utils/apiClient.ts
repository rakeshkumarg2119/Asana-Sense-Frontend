/**
 * Central HTTP/WebSocket client for FastAPI / Python backend with Ngrok Bridge support.
 */
import type { UserProfile, YogaPose, PracticeSession, AuthResponse, SessionPoseRecord, PoseDetectionResult } from '../types';

// ── Backend Configuration & Ngrok Bridge ─────────────────────────────────────

const BACKEND_URL_KEY = 'asana_backend_url';

export function isLocalHostEnv(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

export const DEFAULT_PRODUCTION_BACKEND_URL = 'https://asana-sense-api.onrender.com';

export function hasConfiguredBackend(): boolean {
  return true;
}

export function normalizeBackendUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) {
    if (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim()) {
      const envBase = import.meta.env.VITE_API_BASE.trim().replace(/\/+$/, '');
      if (!envBase.includes('localhost') && !envBase.includes('127.0.0.1') && !envBase.includes('ngrok')) {
        return envBase;
      }
    }
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }

  // If URL contains localhost or ngrok, discard it in favor of the hosted server
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('ngrok')) {
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }

  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Remove trailing slashes
  return url.replace(/\/+$/, '');
}

export function getBackendUrl(): string {
  const stored = localStorage.getItem(BACKEND_URL_KEY);
  if (stored && stored.trim()) {
    const norm = normalizeBackendUrl(stored.trim());
    if (norm && !norm.includes('localhost') && !norm.includes('127.0.0.1') && !norm.includes('ngrok')) {
      return norm;
    }
  }
  if (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim()) {
    const envBase = normalizeBackendUrl(import.meta.env.VITE_API_BASE.trim());
    if (envBase && !envBase.includes('localhost') && !envBase.includes('127.0.0.1') && !envBase.includes('ngrok')) {
      return envBase;
    }
  }
  return DEFAULT_PRODUCTION_BACKEND_URL;
}

export function setBackendUrl(url: string): void {
  const normalized = normalizeBackendUrl(url);
  localStorage.setItem(BACKEND_URL_KEY, normalized);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('asana_backend_changed', { detail: { url: normalized } }));
  }
}

export function clearBackendUrl(): void {
  localStorage.removeItem(BACKEND_URL_KEY);
  const defaultUrl = DEFAULT_PRODUCTION_BACKEND_URL;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('asana_backend_changed', { detail: { url: defaultUrl } }));
  }
}

export function getWsBase(customHttpBase?: string): string {
  const base = customHttpBase ? normalizeBackendUrl(customHttpBase) : getBackendUrl();
  return base
    .replace(/^https:\/\//i, 'wss://')
    .replace(/^http:\/\//i, 'ws://');
}

// ── Token Management ─────────────────────────────────────────────────────────

const TOKEN_KEY = 'asana_sense_jwt';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function isPublicEndpoint(path: string): boolean {
  const publicPaths = [
    '/api/auth/signin',
    '/api/auth/login',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/auth/resend-otp',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/oauth-google',
    '/api/auth/oauth-microsoft',
    '/api/health',
    '/',
  ];
  return publicPaths.some((p) => path === p || path.startsWith(p + '?'));
}

function authHeaders(path?: string): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (path && isPublicEndpoint(path)) {
    return headers;
  }
  if (token && token.trim() && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  return headers;
}

// ── Generic Fetch Wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBackendUrl();
  const url = `${baseUrl}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders(path),
        ...(options.headers || {}),
      },
    });
  } catch (err: any) {
    const offlineErr: any = new Error("Server is temporarily unavailable. We'll be back soon!");
    offlineErr.status = 0;
    offlineErr.isOffline = true;
    throw offlineErr;
  }

  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    let errorDetail: any = null;

    try {
      const body = await res.json();
      errorDetail = body.detail ?? body.message ?? body.error;

      if (Array.isArray(body.detail)) {
        // FastAPI 422 validation errors array: [{ msg: "...", loc: [...] }]
        errorMsg = body.detail
          .map((item: any) => (typeof item === 'string' ? item : item.msg || JSON.stringify(item)))
          .join(', ');
      } else if (typeof errorDetail === 'string' && errorDetail.trim()) {
        errorMsg = errorDetail;
      } else if (typeof body.message === 'string' && body.message.trim()) {
        errorMsg = body.message;
      }
    } catch {
      // Non-JSON response fallback
      if (res.status === 401) {
        errorMsg = 'Invalid email or password. Please verify your credentials.';
      } else if (res.status === 403) {
        errorMsg = 'Access denied or account deactivated.';
      } else if (res.status === 404) {
        errorMsg = 'Requested service endpoint not found.';
      } else if (res.status === 409) {
        errorMsg = 'This email is already registered. Please sign in.';
      } else if (res.status === 429) {
        errorMsg = 'Too many requests. Please wait a moment before trying again.';
      } else if (res.status === 502 || res.status === 503 || res.status === 504) {
        errorMsg = 'Server is currently offline or warming up from a cold start. Please try again shortly.';
      } else {
        errorMsg = res.statusText || `Server returned error (${res.status})`;
      }
    }

    if (res.status === 401) {
      if (!errorDetail) {
        errorMsg = 'Invalid email or password. Please verify your credentials.';
      }
      clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('asana_auth_expired', { detail: { message: errorMsg } }));
      }
    } else if (res.status === 403) {
      errorMsg = errorDetail || 'Access denied or account deactivated';
    } else if (res.status === 429) {
      errorMsg = errorDetail || 'Too many requests, wait a minute';
    } else if ((res.status === 502 || res.status === 503 || res.status === 504) && !errorDetail) {
      errorMsg = 'Server is currently offline or warming up from a cold start. Please try again shortly.';
    }

    const apiError: any = new Error(errorMsg);
    apiError.status = res.status;
    apiError.detail = errorDetail;
    throw apiError;
  }

  return res.json();
}

// ── Backend Diagnostics & Health Check ───────────────────────────────────────

export interface BackendStatusReport {
  connected: boolean;
  httpStatus?: number;
  latencyMs?: number;
  apiUrl: string;
  wsUrl: string;
  message: string;
  isNgrok: boolean;
  serverInfo?: string;
  diagnosis?: string;
  fixTip?: string;
  testedAt: string;
}

export async function checkBackendConnection(targetUrl?: string): Promise<BackendStatusReport> {
  const rawUrl = targetUrl !== undefined ? targetUrl : getBackendUrl();
  const apiUrl = normalizeBackendUrl(rawUrl);
  const wsUrl = apiUrl ? getWsBase(apiUrl) : '';
  const isNgrok = apiUrl.includes('ngrok');
  const startTime = performance.now();

  if (!apiUrl) {
    return {
      connected: false,
      httpStatus: 0,
      latencyMs: 0,
      apiUrl: '',
      wsUrl: '',
      message: 'No backend URL configured.',
      isNgrok: false,
      testedAt: new Date().toLocaleTimeString(),
    };
  }

  // Direct browser fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    let res: Response | null = null;
    let endpointTried = '/api/health';

    try {
      res = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
    } catch {
      endpointTried = '/';
      res = await fetch(`${apiUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (res && res.ok) {
      let serverInfo = res.headers.get('server') || 'FastAPI / Python Service';
      try {
        const json = await res.json();
        if (json.service || json.status || json.message) {
          serverInfo = json.service || json.message || `Status: ${json.status}`;
        }
      } catch {
        // Non-JSON response is ok
      }

      return {
        connected: true,
        httpStatus: res.status,
        latencyMs,
        apiUrl,
        wsUrl,
        message: `Connected successfully (${latencyMs}ms)`,
        isNgrok,
        serverInfo,
        testedAt: new Date().toLocaleTimeString(),
      };
    } else {
      let fixTip = '';
      let message = `Server returned HTTP ${res?.status || 500} on ${endpointTried}`;

      if (res?.status === 404) {
        message = '404 Not Found. Ensure this URL points to your Python FastAPI backend, not the static frontend.';
        fixTip = 'Enter your active Render or Ngrok backend URL in Settings (e.g., https://your-backend.onrender.com).';
      } else if (res?.status === 401 || res?.status === 403) {
        message = `Unauthorized (${res?.status}). Backend endpoint requires valid authorization.`;
      } else if (res?.status === 400) {
        fixTip = 'Restart ngrok with: "ngrok http 8000 --host-header=rewrite" to prevent host rejection.';
      }

      return {
        connected: false,
        httpStatus: res?.status || 500,
        latencyMs,
        apiUrl,
        wsUrl,
        message,
        fixTip,
        isNgrok,
        testedAt: new Date().toLocaleTimeString(),
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    let errMsg = err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Unable to reach backend URL');
    if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
      errMsg = isNgrok 
        ? 'Network request failed. Restart tunnel with --host-header=rewrite.' 
        : 'Cannot reach host. Ensure your Python backend is running.';
    }

    return {
      connected: false,
      latencyMs,
      apiUrl,
      wsUrl,
      message: errMsg,
      fixTip: isNgrok ? 'Run: "ngrok http 8000 --host-header=rewrite"' : undefined,
      isNgrok,
      testedAt: new Date().toLocaleTimeString(),
    };
  }
}

export function testWebSocketHandshake(wsUrl: string, timeoutMs: number = 5000): Promise<{ success: boolean; latencyMs: number; message: string }> {
  return new Promise((resolve) => {
    const start = performance.now();
    let socket: WebSocket | null = null;
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (socket) {
        socket.onopen = null;
        socket.onerror = null;
        socket.onclose = null;
        try {
          socket.close();
        } catch {
          // ignore
        }
      }
    };

    try {
      socket = new WebSocket(wsUrl);

      timer = setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          latencyMs: Math.round(performance.now() - start),
          message: 'WebSocket connection timed out',
        });
      }, timeoutMs);

      socket.onopen = () => {
        const latency = Math.round(performance.now() - start);
        cleanup();
        resolve({
          success: true,
          latencyMs: latency,
          message: `WebSocket handshake active (${latency}ms)`,
        });
      };

      socket.onerror = (e) => {
        const latency = Math.round(performance.now() - start);
        cleanup();
        resolve({
          success: false,
          latencyMs: latency,
          message: 'WebSocket connection refused or CORS error',
        });
      };
    } catch (e: any) {
      cleanup();
      resolve({
        success: false,
        latencyMs: 0,
        message: e.message || 'Invalid WebSocket URL scheme',
      });
    }
  });
}

// ── Auth & Account Management (Strict Backend Connection) ───────────────────

/**
 * Temporarily clears all local storage caches, user profiles, tokens, and session history.
 */
export function clearAllLocalStorage(): void {
  const keysToRemove = [
    TOKEN_KEY,
    'asana_sense_user_profile_v2',
    'asana_pose_records',
    'asana_practice_sessions',
    'asana_audio_tracks',
    'has_completed_onboarding',
  ];
  keysToRemove.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  });

  try {
    sessionStorage.removeItem('asana_signed_in');
    sessionStorage.removeItem('asana_entered_session');
    sessionStorage.removeItem('asana_exited_session');
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    (window as any).clearAsanaStorage = clearAllLocalStorage;
  }
}

// Expose on window for convenience
if (typeof window !== 'undefined') {
  (window as any).clearAsanaStorage = clearAllLocalStorage;
}

/**
 * Triggers backend welcome email dispatch on verified account creation.
 * Route: POST /api/auth/send-welcome-email
 */
export async function apiSendWelcomeEmail(payload: { name: string; email: string; userId?: string }): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/auth/send-welcome-email', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        user_id: payload.userId,
        timestamp: new Date().toISOString(),
      }),
    });
    return res;
  } catch (err: any) {
    console.info('[apiClient] Welcome email notification trigger:', err?.message || err);
    return { success: false, message: err?.message || 'Welcome email endpoint called' };
  }
}

/**
 * Sends a 6-digit OTP code to the practitioner's email before registration.
 * Route: POST /api/auth/send-otp
 * Payload: { name, email, password }
 */
export async function apiSendOtp(name: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'Practitioner';

  return apiFetch<{ success: boolean; message: string }>('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({
      name: cleanName,
      email: cleanEmail,
      password,
    }),
  });
}

/**
 * Verifies the 6-digit OTP code and completes registration on the backend.
 * Route: POST /api/auth/verify-otp
 * Payload: { email, otp }
 */
// ── Custom Display Name Registry Helper ──────────────────────────────────────

const STORAGE_KEY_CUSTOM_NAMES = 'asana_user_custom_names_v1';

export function getCustomNameRegistry(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_NAMES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCustomDisplayName(email: string, name: string): void {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  if (!cleanEmail || !cleanName) return;
  try {
    const reg = getCustomNameRegistry();
    reg[cleanEmail] = cleanName;
    localStorage.setItem(STORAGE_KEY_CUSTOM_NAMES, JSON.stringify(reg));
  } catch (e) {
    console.warn('[apiClient] Failed to save custom display name:', e);
  }
}

function applyStoredCustomName(user: UserProfile | null): UserProfile | null {
  if (!user || !user.email) return user;
  const cleanEmail = user.email.trim().toLowerCase();
  try {
    const reg = getCustomNameRegistry();
    const customName = reg[cleanEmail];
    if (customName && typeof customName === 'string' && customName.trim()) {
      const trimmed = customName.trim();
      const seed = trimmed.slice(0, 2).toUpperCase();
      user.name = trimmed;
      user.display_name = trimmed;
      user.full_name = trimmed;
      user.avatarSeed = seed;
      user.avatar_seed = seed;
    }
  } catch {
    // ignore
  }
  return user;
}

export async function apiVerifyOtp(email: string, otp: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  const data = await apiFetch<AuthResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      email: cleanEmail,
      otp: otp.trim(),
    }),
  });

  if (data.token) setToken(data.token);
  if (data.user) {
    applyStoredCustomName(data.user);
    localStorage.setItem('asana_sense_user_profile_v2', JSON.stringify(data.user));
  }
  
  return data;
}

/**
 * Resends a fresh 6-digit OTP code to the practitioner's email.
 * Route: POST /api/auth/resend-otp
 * Payload: { email }
 */
export async function apiResendOtp(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  return apiFetch<{ success: boolean; message: string }>('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email: cleanEmail }),
  });
}

/**
 * Standard Sign In (Strict backend verification, no fake mock profiles or deceptive offline login)
 * Route: POST /api/auth/signin or POST /api/auth/login
 * Payload: { email, password }
 */
export async function apiSignIn(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  let data: AuthResponse;
  try {
    data = await apiFetch<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, password }),
    });
  } catch (err: any) {
    if (err?.status === 404) {
      data = await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });
    } else {
      throw err;
    }
  }

  if (data.token) setToken(data.token);
  if (data.user) {
    // Always preserve and apply user's edited display name if one was saved
    applyStoredCustomName(data.user);
    localStorage.setItem('asana_sense_user_profile_v2', JSON.stringify(data.user));
  }
  return data;
}

/**
 * OAuth Login / Registration (Google Sign-In - already pre-verified by identity provider)
 * Route: POST /api/auth/oauth-google
 */
export async function apiOAuthGoogle(
  credential: string,
  _profile?: { email?: string; name?: string; avatarUrl?: string },
): Promise<AuthResponse> {
  return finishOAuth('/api/auth/oauth-google', credential);
}

export async function apiOAuthMicrosoft(idToken: string): Promise<AuthResponse> {
  return finishOAuth('/api/auth/oauth-microsoft', idToken);
}

async function finishOAuth(path: string, credential: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>(path, {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  if (data.token) setToken(data.token);
  if (data.user) {
    applyStoredCustomName(data.user);
    localStorage.setItem('asana_sense_user_profile_v2', JSON.stringify(data.user));
  }
  return data;
}


export async function apiGetMe(): Promise<{ success: boolean; user: UserProfile }> {
  try {
    const res = await apiFetch<{ success: boolean; user: UserProfile }>('/api/auth/me');
    if (res?.user) {
      applyStoredCustomName(res.user);
      localStorage.setItem('asana_sense_user_profile_v2', JSON.stringify(res.user));
      return { success: true, user: res.user };
    }
    return res;
  } catch {
    const raw = localStorage.getItem('asana_sense_user_profile_v2');
    if (raw) {
      const user = JSON.parse(raw);
      applyStoredCustomName(user);
      return { success: true, user };
    }
    throw new Error('User not found');
  }
}

export async function apiUpdateProfile(updates: Record<string, any>): Promise<{ success: boolean; user: UserProfile }> {
  const currentRaw = localStorage.getItem('asana_sense_user_profile_v2');
  let currentProfile: UserProfile | null = currentRaw ? JSON.parse(currentRaw) : null;

  const email = (currentProfile?.email || updates.email || '').trim().toLowerCase();

  if (updates.name && typeof updates.name === 'string' && updates.name.trim()) {
    const trimmedName = updates.name.trim();
    if (email) {
      setCustomDisplayName(email, trimmedName);
    }
    if (currentProfile) {
      currentProfile.name = trimmedName;
      currentProfile.display_name = trimmedName;
      currentProfile.full_name = trimmedName;
      currentProfile.avatarSeed = trimmedName.slice(0, 2).toUpperCase();
      currentProfile.avatar_seed = trimmedName.slice(0, 2).toUpperCase();
    }
  }

  if (currentProfile) {
    currentProfile = { ...currentProfile, ...updates };
    localStorage.setItem('asana_sense_user_profile_v2', JSON.stringify(currentProfile));
  }

  // Attempt sync with backend using common FastAPI schema patterns
  const payload = {
    ...updates,
    name: updates.name ? updates.name.trim() : undefined,
    display_name: updates.name ? updates.name.trim() : undefined,
    full_name: updates.name ? updates.name.trim() : undefined,
    username: updates.name ? updates.name.trim() : undefined,
  };

  try {
    let data: any = null;
    try {
      data = await apiFetch<{ success: boolean; user: UserProfile }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch {
      try {
        data = await apiFetch<{ success: boolean; user: UserProfile }>('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } catch {
        data = await apiFetch<{ success: boolean; user: UserProfile }>('/api/auth/me', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
    }

    if (data?.user) {
      if (updates.name && email) {
        setCustomDisplayName(email, updates.name.trim());
      }
      applyStoredCustomName(data.user);
      localStorage.setItem('asana_sense_user_profile_v2', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: true, user: currentProfile! };
  } catch (err: any) {
    console.warn('[apiClient] Backend update profile notice:', err?.message || err);
    if (updates.name && email) {
      setCustomDisplayName(email, updates.name.trim());
    }
    return { success: true, user: currentProfile! };
  }
}

export const updateProfileOnAPI = apiUpdateProfile;

/**
 * Request password reset email / link.
 * Route: POST /api/auth/forgot-password
 */
export async function apiForgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const currentOrigin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:3000') && !window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://asana-sense-ai.vercel.app');
  
  return await apiFetch<{ success: boolean; message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email: cleanEmail,
      origin: currentOrigin,
      redirect_url: `${currentOrigin}/?mode=reset-password`,
      frontend_url: currentOrigin,
      app_url: currentOrigin,
      domain: currentOrigin,
    }),
  });
}

/**
 * Submit new password with verification token.
 * Route: POST /api/auth/reset-password
 */
export async function apiResetPassword(token: string, email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  return await apiFetch<{ success: boolean; message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: token.trim(),
      email: cleanEmail,
      new_password: newPassword,
    }),
  });
}

export interface CookieConsentPreferences {
  essential: boolean; // Always true
  functional: boolean; // Audio soundscapes, voice prompts
  analytics: boolean; // Telemetry & FPS performance logs
  hasConsented: boolean;
  timestamp: number;
}

export const COOKIE_CONSENT_KEY = 'asana_cookie_consent_v1';

export function getCookieConsent(): CookieConsentPreferences | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(prefs: Partial<CookieConsentPreferences>): CookieConsentPreferences {
  const finalPrefs: CookieConsentPreferences = {
    essential: true,
    functional: prefs.functional ?? true,
    analytics: prefs.analytics ?? true,
    hasConsented: true,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(finalPrefs));
  } catch {
    // ignore
  }
  return finalPrefs;
}

export async function apiDeleteAccount(): Promise<{ success: boolean; message: string }> {
  const token = getToken();
  
  // Extract user email to purge custom names on permanent deletion
  try {
    const userRaw = localStorage.getItem('asana_sense_user_profile_v2');
    if (userRaw) {
      const userObj = JSON.parse(userRaw);
      if (userObj?.email) {
        const cleanEmail = userObj.email.trim().toLowerCase();
        const customNamesRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_NAMES);
        if (customNamesRaw) {
          const customNames = JSON.parse(customNamesRaw);
          delete customNames[cleanEmail];
          localStorage.setItem(STORAGE_KEY_CUSTOM_NAMES, JSON.stringify(customNames));
        }
        localStorage.removeItem(`asana_welcomed_${cleanEmail}`);
      }
    }
  } catch {
    // ignore
  }

  try {
    const response = await apiFetch<{ success: boolean; message: string }>('/api/auth/account', {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    clearToken();
    clearAllLocalStorage();
    return response;
  } catch (err: any) {
    console.warn('[apiClient] Remote delete account endpoint notice:', err?.message || err);
    clearToken();
    clearAllLocalStorage();
    return { success: true, message: 'Account cleared locally' };
  }
}

export function apiLogout(): void {
  clearToken();
  clearAllLocalStorage();
}

// ── Poses API ────────────────────────────────────────────────────────────────

export async function apiFetchPoses(): Promise<YogaPose[]> {
  const data = await apiFetch<{ success: boolean; poses: YogaPose[] }>('/api/poses');
  return data.poses || [];
}

export async function apiFetchPose(poseId: string): Promise<YogaPose> {
  const data = await apiFetch<{ success: boolean; pose: YogaPose }>(`/api/poses/${poseId}`);
  return data.pose;
}

// ── Sessions API ─────────────────────────────────────────────────────────────

export async function apiSaveSession(session: {
  start_time: number;
  end_time: number;
  total_duration_seconds: number;
  poses_recorded: SessionPoseRecord[];
  overall_accuracy: number;
  calories_burned_est: number;
  ai_report?: any;
}): Promise<{ success: boolean; session_id: string }> {
  return apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

export async function apiFetchSessions(): Promise<PracticeSession[]> {
  const data = await apiFetch<{ success: boolean; sessions: PracticeSession[] }>('/api/sessions');
  return data.sessions || [];
}

export async function apiFetchSession(sessionId: string): Promise<PracticeSession> {
  const data = await apiFetch<{ success: boolean; session: PracticeSession }>(`/api/sessions/${sessionId}`);
  return data.session;
}

// ── WebSocket for Pose Detection ─────────────────────────────────────────────

export function createPoseWebSocket(
  onMessage: (data: PoseDetectionResult) => void,
  onError?: (err: Event) => void,
  onClose?: () => void,
): WebSocket {
  const wsUrl = `${getWsBase()}/ws/pose-detect`;
  console.log('[WS] Connecting to pose detection stream at:', wsUrl);
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[WS] Connected to pose detection backend');
  };

  ws.onmessage = (event) => {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (data.type === 'error') {
      console.warn('[WS]', data.code, data.message);
      if (data.code === 'model_not_loaded') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('asana_toast', { detail: { message: 'Server model offline' } }));
        }
      }
      return; // never build a result from an error
    }

    if (data.type !== 'pose_result') return;

    onMessage({
      predicted_pose: data.predicted_pose ?? 'no_pose',
      confidence: Number(data.confidence ?? 0),
      target_pose: data.target_pose ?? '',
      is_correct: Boolean(data.is_correct),
      has_red: Boolean(data.has_red),
      has_yellow: Boolean(data.has_yellow),
      joints: Array.isArray(data.joints) ? data.joints : [],
      pose_mismatch: Boolean(data.pose_mismatch),
      pose_detected: data.pose_detected !== false,
      reference_available: data.reference_available !== false,
      timer_action: data.timer_action ?? 'idle',
      correction_message: data.correction_message ?? '',
    });
  };

  ws.onerror = (err) => {
    console.warn('[WS] WebSocket error:', err);
    onError?.(err);
  };

  ws.onclose = () => {
    console.log('[WS] WebSocket closed');
    onClose?.();
  };

  return ws;
}

export function sendLandmarks(
  ws: WebSocket,
  targetPose: string,
  landmarks: number[][],
): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'landmarks',
      target_pose: targetPose,
      landmarks,
    }));
  }
}

export async function apiHealthCheck(): Promise<boolean> {
  const baseUrl = getBackendUrl();
  if (!baseUrl) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      try {
        const body = await res.json();
        if (typeof body === 'object' && body !== null) {
          if (body.status === false || body.connected === false) return false;
        }
        return true;
      } catch {
        return true;
      }
    }
  } catch {
    // Try root endpoint as fallback
    try {
      const rootController = new AbortController();
      const rootTimeout = setTimeout(() => rootController.abort(), 3500);
      const rootRes = await fetch(`${baseUrl}/`, {
        method: 'GET',
        signal: rootController.signal,
      });
      clearTimeout(rootTimeout);
      return rootRes.ok;
    } catch {
      return false;
    }
  }
  return false;
}

// ── FastAPI Biomechanics Session Report Generator ────────────────────────────

export async function apiGenerateSessionReport(payload: {
  sessionData: any;
  previousSessionData?: any;
}): Promise<{ success: boolean; data: any }> {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/generate-session-report', {
      method: 'POST',
      body: JSON.stringify({
        sessionData: payload.sessionData,
        previousSessionData: payload.previousSessionData,
      }),
    });
    if (res && res.success && res.data) {
      return res;
    }
    throw new Error('FastAPI backend did not return a valid report');
  } catch (e: any) {
    console.warn('[apiClient] FastAPI generate-session-report error:', e?.message || e);
    throw e;
  }
}

// ── Automated SMTP Email Dispatch ─────────────────────────────────────────────

export async function apiSendSessionEmail(payload: {
  sessionData: any;
  aiReport?: any;
  to_email?: string;
  email?: string;
  user_email?: string;
}): Promise<{ success: boolean; message: string; to_email?: string }> {
  const targetEmail = payload.to_email || payload.email || payload.user_email;
  return apiFetch('/api/send-session-report-email', {
    method: 'POST',
    body: JSON.stringify({
      sessionData: payload.sessionData,
      aiReport: payload.aiReport,
      to_email: targetEmail,
      email: targetEmail,
      user_email: targetEmail,
    }),
  });
}

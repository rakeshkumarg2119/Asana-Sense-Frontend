/**
 * Device detection helper for Asana Sense
 * Detects mobile screens, phones, and tablets.
 */

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Viewport width heuristic (phones and small tablets)
  const isSmallScreen = window.innerWidth <= 768;

  // Touch & User-Agent heuristics
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return isSmallScreen || (isMobileUA && isTouch);
}

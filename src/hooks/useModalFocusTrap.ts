import { useEffect, useRef } from 'react';

interface UseModalFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export function useModalFocusTrap({ isOpen, onClose, initialFocusRef }: UseModalFocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus on unmount/close
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // Determine focusable elements
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

    const getFocusableElements = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => el.offsetParent !== null && !el.hasAttribute('disabled')
      );

    // Initial focus
    requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          container.focus();
        }
      }
    });

    // Keydown handler for Tab trapping and Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last
          if (document.activeElement === firstElement || document.activeElement === container) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      // Restore previous focus
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef]);

  return containerRef;
}

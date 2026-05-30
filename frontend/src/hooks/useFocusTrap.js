import { useEffect } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;

    const getFocusable = () => [...el.querySelectorAll(FOCUSABLE)].filter(n => !n.closest('[hidden]'));

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !el.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !el.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener('keydown', onKeyDown);
    // Move focus inside on mount
    const firstFocusable = getFocusable()[0];
    if (firstFocusable && !el.contains(document.activeElement)) firstFocusable.focus();

    return () => el.removeEventListener('keydown', onKeyDown);
  }, [ref, active]);
}

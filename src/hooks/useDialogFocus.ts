/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Makes an overlay behave as a modal dialog while `open`: focus moves to its
// first focusable element, Tab cycles within it, Escape calls onClose, and
// focus returns to whatever opened it on close. Don't put autoFocus inside:
// it runs before this effect, so the opener would never be recorded.
export function useDialogFocus(containerRef: RefObject<HTMLElement | null>, open: boolean, onClose: () => void): void {
  // Kept in a ref so an inline onClose doesn't re-run the effect (and bounce
  // focus back to the opener) on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const container = containerRef.current;
    if (container && !container.contains(document.activeElement)) {
      container.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      const el = containerRef.current;
      if (e.key !== 'Tab' || !el) return;
      const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outside = !el.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      returnFocusTo?.focus();
    };
  }, [open, containerRef]);
}

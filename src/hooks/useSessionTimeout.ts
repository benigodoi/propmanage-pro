/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Mirrors supabase/config.toml auth.sessions (inactivity_timeout / timebox)
// so the client proactively signs out at the same thresholds instead of
// waiting for the access token to expire and the next API call to fail.
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const WARNING_LEAD_MS = 60 * 1000;
const CHECK_INTERVAL_MS = 5 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

// Returns seconds remaining once the idle warning window is reached (null
// otherwise), and a `stayActive` callback to reset the idle clock.
export function useSessionTimeout(active: boolean, onTimeout: () => void) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const stayActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSecondsRemaining(null);
  }, []);

  useEffect(() => {
    if (!active) {
      setSecondsRemaining(null);
      return;
    }

    sessionStartRef.current = Date.now();
    lastActivityRef.current = Date.now();

    const handleActivity = () => stayActive();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const now = Date.now();
      const idleFor = now - lastActivityRef.current;
      const sessionFor = now - sessionStartRef.current;

      if (idleFor >= IDLE_TIMEOUT_MS || sessionFor >= ABSOLUTE_TIMEOUT_MS) {
        window.clearInterval(interval);
        onTimeoutRef.current();
        return;
      }

      const idleRemaining = IDLE_TIMEOUT_MS - idleFor;
      setSecondsRemaining(idleRemaining <= WARNING_LEAD_MS ? Math.ceil(idleRemaining / 1000) : null);
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      window.clearInterval(interval);
    };
  }, [active, stayActive]);

  return { secondsRemaining, stayActive };
}

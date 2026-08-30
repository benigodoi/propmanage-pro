/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';

// Prevents double-submit: repeated clicks on a create/delete button before
// its request resolves used to fire multiple inserts of the same row (e.g.
// duplicate units/tenants). `submitting` drives the disabled/label state;
// the ref check is what actually blocks a second concurrent call, since a
// React state update isn't guaranteed to have re-rendered (and the button
// re-disabled) before a rapid second click is handled.
export function useAsyncGuard(): [boolean, (fn: () => Promise<void>) => Promise<void>] {
  const [submitting, setSubmitting] = useState(false);
  const inFlightRef = useRef(false);

  const run = useCallback(async (fn: () => Promise<void>) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    try {
      await fn();
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }, []);

  return [submitting, run];
}

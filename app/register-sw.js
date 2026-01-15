/**
 * Purpose: Client-side service worker registration for PWA support.
 * Exports: ServiceWorkerRegistration component.
 * Invariants:
 * - Only runs in browser (client component).
 * - Registers /sw.js on mount.
 * - Silently handles registration errors (logs to console).
 */

'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration);
        })
        .catch((error) => {
          console.log('[SW] Registration failed:', error);
        });
    }
  }, []);

  return null;
}

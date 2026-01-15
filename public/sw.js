/**
 * Purpose: Minimal service worker for PWA requirements.
 * Currently: No-op service worker (no caching implemented).
 * Future: Add offline support and caching strategy when needed.
 */

// Install event - fires when service worker is first installed
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - fires when service worker takes control
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - intercepts network requests (currently does nothing)
self.addEventListener('fetch', (event) => {
  // Pass through to network - no caching yet
  event.respondWith(fetch(event.request));
});

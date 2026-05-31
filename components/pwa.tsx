'use client';
import { useEffect } from 'react';

// Registers the service worker so CoWriter is installable and opens offline.
// Renders nothing.
export function PWARegister() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}

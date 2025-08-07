// --- Client-side error logging for development ---
if (import.meta.env.DEV) {
  const sendErrorToServer = (payload: object) => {
    const body = JSON.stringify(payload);
    // Use navigator.sendBeacon for robustness, as it works even if the page is unloading.
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/log-error', body);
    } else {
      // Fallback to fetch for browsers that don't support it.
      fetch('/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true, // Important for requests during page unload
      });
    }
  };

  window.addEventListener('error', (event: ErrorEvent) => {
    sendErrorToServer({
      message: event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason instanceof Error) {
      sendErrorToServer({
        message: `Unhandled promise rejection: ${reason.message}`,
        stack: reason.stack,
      });
    } else {
      // Handle cases where the rejection reason is not an Error object
      sendErrorToServer({
        message: `Unhandled promise rejection: ${String(reason)}`,
      });
    }
  });
}
// --- End of error logging ---

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// --- FORCED ERROR FOR TESTING ---
// This will throw an error 3 seconds after the app loads in development.
// You should see this error reported in your Vite terminal.
if (import.meta.env.DEV) {
  setTimeout(() => {
    throw new Error('This is a test error to check the Vite console logger.');
  }, 3000);
}

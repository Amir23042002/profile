import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/demoSetup'

// Register service worker
if ('serviceWorker' in navigator && !window.location.hostname.includes('stackblitz')) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      if (error.message && error.message.includes('Service Workers are not yet supported on StackBlitz')) {
        console.warn('Service Workers are not supported in this environment (StackBlitz)');
      } else {
        console.error('Service Worker registration failed:', error);
      }
    });
} else if (window.location.hostname.includes('stackblitz')) {
  console.warn('Service Workers are not supported in StackBlitz environment');
}

createRoot(document.getElementById("root")!).render(<App />);

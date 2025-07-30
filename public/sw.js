const CACHE_NAME = 'oyiee-profile-cache-v1';
const PROFILE_CACHE_NAME = 'oyiee-profile-data-v1';

// Only cache these files when user is authenticated with profile
const PROFILE_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

let isUserAuthenticated = false;
let userProfile = null;

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_AUTH_STATUS') {
    isUserAuthenticated = event.data.isAuthenticated;
    userProfile = event.data.profile;
    
    if (isUserAuthenticated && userProfile) {
      // Cache profile assets when user logs in with profile
      cacheProfileAssets();
    } else {
      // Clear cache when user logs out or has no profile
      clearAllCaches();
    }
  }
  
  if (event.data.type === 'UPDATE_PROFILE_CACHE') {
    // Update cached profile data
    updateProfileCache(event.data.profile);
  }
});

// Install event - don't cache anything initially
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Fetch event - handle caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // If user is not authenticated or has no profile, don't cache anything
  if (!isUserAuthenticated || !userProfile) {
    return;
  }
  
  // Handle profile page requests
  if (url.pathname.startsWith('/profile/')) {
    event.respondWith(handleProfileRequest(event.request));
    return;
  }
  
  // Handle static assets for profile page
  if (PROFILE_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(handleAssetRequest(event.request));
    return;
  }
});

async function cacheProfileAssets() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PROFILE_ASSETS);
    console.log('Profile assets cached');
  } catch (error) {
    console.error('Failed to cache profile assets:', error);
  }
}

async function handleProfileRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the successful response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Network failed, trying cache');
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache and no network, return offline page
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>Offline - OYIEE</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: system-ui; text-align: center; padding: 2rem; background: #000; color: #ffd700; }
        h1 { color: #ffd700; }
      </style>
    </head>
    <body>
      <h1>You're Offline</h1>
      <p>Your profile data is cached and will load when you return to the profile page.</p>
      <p>Please check your internet connection to access other features.</p>
    </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

async function handleAssetRequest(request) {
  try {
    // Try cache first for assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function updateProfileCache(profile) {
  try {
    const cache = await caches.open(PROFILE_CACHE_NAME);
    const profileData = new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/api/profile-data', profileData);
    console.log('Profile data cached');
  } catch (error) {
    console.error('Failed to update profile cache:', error);
  }
}

async function clearAllCaches() {
  try {
    await caches.delete(CACHE_NAME);
    await caches.delete(PROFILE_CACHE_NAME);
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// Listen for online/offline events
self.addEventListener('online', () => {
  console.log('Back online - updating cache');
  if (isUserAuthenticated && userProfile) {
    cacheProfileAssets();
  }
});

self.addEventListener('offline', () => {
  console.log('Gone offline');
});
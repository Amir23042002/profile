import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, UserProfile } from '@/lib/firestore';

export const useServiceWorker = () => {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
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
    }
  }, []);

  useEffect(() => {
    const updateServiceWorkerAuth = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        let profile: UserProfile | null = null;
        
        if (user) {
          try {
            profile = await getUserProfile(user.uid);
          } catch (error) {
            console.error('Failed to get user profile:', error);
          }
        }

        navigator.serviceWorker.controller.postMessage({
          type: 'SET_AUTH_STATUS',
          isAuthenticated: !!user,
          profile: profile
        });
      }
    };

    updateServiceWorkerAuth();
  }, [user]);

  const updateProfileCache = (profile: UserProfile) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_PROFILE_CACHE',
        profile: profile
      });
    }
  };

  return { updateProfileCache };
};
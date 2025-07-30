import { createNFCCode } from './firestore';

export const setupDemoData = async () => {
  try {
    // Create a demo NFC code that's unlinked
    await createNFCCode('DEMO123');
    console.log('Demo NFC code created successfully');
  } catch (error) {
    console.log('Demo code may already exist or error occurred:', error);
  }
};

// Call this on app initialization for demo purposes
if (typeof window !== 'undefined') {
  setupDemoData();
}
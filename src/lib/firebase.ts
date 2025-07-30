import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBkHWKWxOHs7U6IKEZp2HNMuibD6TxSkiM",
  authDomain: "oyieeprofile.firebaseapp.com",
  projectId: "oyieeprofile",
  storageBucket: "oyieeprofile.firebasestorage.app",
  messagingSenderId: "420530930810",
  appId: "1:420530930810:web:082474da5998fd2a43a7c3",
  measurementId: "G-01FJXM5F84"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
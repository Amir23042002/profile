import { db } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

export interface NFCCode {
  isLinked: boolean;
  linkedTo: string | null;
}

export interface UserProfile {
  name: string;
  username: string;
  bio?: string;
  photo?: string;
  email: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  phone?: string;
  linkedCodes: string[];
  userId: string;
}

// NFC Code operations
export const getNFCCode = async (code: string): Promise<NFCCode | null> => {
  try {
    const docRef = doc(db, 'nfc_codes', code);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as NFCCode;
    }
    return null;
  } catch (error) {
    console.error('Error getting NFC code:', error);
    return null;
  }
};

export const createNFCCode = async (code: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'nfc_codes', code), {
      isLinked: false,
      linkedTo: null
    });
  } catch (error) {
    console.error('Error creating NFC code:', error);
    throw error;
  }
};

export const linkNFCCode = async (code: string, userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'nfc_codes', code), {
      isLinked: true,
      linkedTo: userId
    });
  } catch (error) {
    console.error('Error linking NFC code:', error);
    throw error;
  }
};

// User Profile operations
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const createUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', profile.userId), profile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfileByCode = async (code: string): Promise<UserProfile | null> => {
  try {
    const q = query(collection(db, 'users'), where('linkedCodes', 'array-contains', code));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { ...doc.data(), userId: doc.id } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile by code:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), profile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Check for duplicate username/email
export const checkUsernameExists = async (username: string, excludeUserId?: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (excludeUserId) {
      return querySnapshot.docs.some(doc => doc.id !== excludeUserId);
    }
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
};

export const checkEmailExists = async (email: string, excludeUserId?: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (excludeUserId) {
      return querySnapshot.docs.some(doc => doc.id !== excludeUserId);
    }
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};
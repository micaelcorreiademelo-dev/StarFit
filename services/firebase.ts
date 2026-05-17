import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { User, UserRole } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error('Error logging in with Email', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  } catch (error) {
    console.error('Error registering with Email', error);
    throw error;
  }
};


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export const syncUserToFirestore = async (firebaseUser: FirebaseUser, role: UserRole = 'STUDENT', username?: string): Promise<User> => {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const existingData = userDoc.data() as User;
    // Force promotion if it's the master email but role isn't ADMIN
    let needsUpdate = false;
    let updates: any = {};
    if (firebaseUser.email === 'micaelcorreiademelo@gmail.com' && existingData.role !== 'ADMIN') {
      updates.role = 'ADMIN';
      needsUpdate = true;
    }
    
    // Auto-migrate trainers who don't have a username yet by assigning a random one if username isn't passed
    // But if username is explicitly passed during registration flow, we use it.
    if (existingData.role === 'TRAINER') {
        if (username && !existingData.username) {
            updates.username = username;
            needsUpdate = true;
        } else if (!existingData.username) {
            updates.username = `@trainer_${firebaseUser.uid.substring(0, 5).toLowerCase()}`;
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
      await updateDoc(userDocRef, updates);
      return { ...existingData, ...updates };
    }

    return existingData;
  }

  // Master Admin Bootstrap
  let finalRole = role;
  if (firebaseUser.email === 'micaelcorreiademelo@gmail.com') {
    finalRole = 'ADMIN';
  }

  const newUser: User = {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'Novo Usuário',
    email: firebaseUser.email || '',
    role: finalRole,
    avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
  };

  if (finalRole === 'TRAINER') {
      // If trainer, set username
      newUser.username = username || `@trainer_${firebaseUser.uid.substring(0, 5).toLowerCase()}`;
  }

  await setDoc(userDocRef, {
    ...newUser,
    createdAt: serverTimestamp(),
    onboardingCompleted: false
  });

  return newUser;
};

export const logoutUser = () => signOut(auth);

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    return result.user;
  } catch (error) {
    console.error('Error logging in with Google', error);
    throw error;
  }
};

export const loginWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Error logging in with Google Redirect', error);
    throw error;
  }
};

export const handleRedirectResult = () => getRedirectResult(auth);

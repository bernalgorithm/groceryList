import {
  auth,
  isFirebaseConfigured,
  signInAnonymously as fbSignInAnonymously,
  signInWithEmailAndPassword as fbSignInWithEmail,
  createUserWithEmailAndPassword as fbCreateUser,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  FirebaseUser,
} from '../config/firebase';

export interface AuthState {
  isConfigured: boolean;
  user: FirebaseUser | null;
  loading: boolean;
}

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  if (!isFirebaseConfigured() || !auth) {
    callback(null);
    return () => {};
  }
  return fbOnAuthStateChanged(auth, callback);
};

export const signInAnonymousUser = async (): Promise<FirebaseUser | null> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase is not configured. Please add keys to .env');
  }
  const credential = await fbSignInAnonymously(auth);
  return credential.user;
};

export const signInWithEmail = async (
  email: string,
  pass: string
): Promise<FirebaseUser | null> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase is not configured. Please add keys to .env');
  }
  const credential = await fbSignInWithEmail(auth, email, pass);
  return credential.user;
};

export const registerWithEmail = async (
  email: string,
  pass: string
): Promise<FirebaseUser | null> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase is not configured. Please add keys to .env');
  }
  const credential = await fbCreateUser(auth, email, pass);
  return credential.user;
};

export const signOutCloudUser = async (): Promise<void> => {
  if (!isFirebaseConfigured() || !auth) return;
  await fbSignOut(auth);
};

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  Auth,
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Persistence,
} from 'firebase/auth';
import {
  Firestore,
  getFirestore,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In React Native, getReactNativePersistence is imported from @firebase/auth
// We safely resolve it based on platform to prevent bundling errors.
let reactNativePersistence: Persistence | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const authModule = require('@firebase/auth');
  if (authModule.getReactNativePersistence) {
    reactNativePersistence = authModule.getReactNativePersistence(AsyncStorage) as Persistence;
  }
} catch {
  // Fallback if not available in current environment
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey !== 'your_api_key_here' &&
      firebaseConfig.projectId &&
      firebaseConfig.projectId !== 'your_project_id'
  );
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    if (Platform.OS === 'web') {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } else if (reactNativePersistence) {
      auth = initializeAuth(app, {
        persistence: reactNativePersistence,
      });
    } else {
      auth = getAuth(app);
    }

    db = getFirestore(app);
  } catch (error) {
    console.warn('[Firebase] Initialization warning:', error);
  }
}

export {
  app,
  auth,
  db,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
export type { FirebaseUser };

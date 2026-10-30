import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Embedded default config for flawless external / Vercel builds
const FALLBACK_CONFIG = {
  projectId: "splendid-tangent-m4jp1",
  appId: "1:906768841738:web:9d1d29e03a053630c8f3f3",
  apiKey: "AIzaSyBmN_-S9vHuDz3kGjgbBWaRmxh7AGlQ1RI",
  authDomain: "splendid-tangent-m4jp1.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-ce76918a-f486-4fcd-9411-06914b5b2112",
  storageBucket: "splendid-tangent-m4jp1.firebasestorage.app",
  messagingSenderId: "906768841738",
};

// Support embedded defaults, bundled file, and optional Vercel environment variables
const resolvedConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId || FALLBACK_CONFIG.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig?.appId || FALLBACK_CONFIG.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey || FALLBACK_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain || FALLBACK_CONFIG.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId || FALLBACK_CONFIG.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket || FALLBACK_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId || FALLBACK_CONFIG.messagingSenderId,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore (using custom databaseId if specified)
export const db = resolvedConfig.firestoreDatabaseId && resolvedConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, resolvedConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot per Firebase skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline.');
    }
    return false;
  }
}

export default app;

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from './config';

export interface OfficerAuthContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  setSyncStatus: (status: 'synced' | 'syncing' | 'offline' | 'error') => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  quickLoginOfficer: (officerIndex: number, officerName: string, unionName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<OfficerAuthContextType | undefined>(undefined);

// 25 Pre-configured Officer profiles for Rangunia Upazila
export const PRESET_OFFICERS = [
  { index: 1, name: 'তারেক আজিজ', designation: 'মাঠ সহকারী', union: '০৫. পোমরা ইউনিয়ন', emailPrefix: 'officer01' },
  { index: 2, name: 'মোহাম্মদ রফিক', designation: 'মাঠ সহকারী', union: '০১. রাজানগর ইউনিয়ন', emailPrefix: 'officer02' },
  { index: 3, name: 'নুরুল হক', designation: 'মাঠ সহকারী', union: '০২. হোছনাবাদ ইউনিয়ন', emailPrefix: 'officer03' },
  { index: 4, name: 'আবুল কালাম', designation: 'মাঠ সহকারী', union: '০৩. দক্ষিণ রাজানগর ইউনিয়ন', emailPrefix: 'officer04' },
  { index: 5, name: 'জসিম উদ্দিন', designation: 'মাঠ সহকারী', union: '০৪. পারুয়া ইউনিয়ন', emailPrefix: 'officer05' },
  { index: 6, name: 'শাহ আলম', designation: 'মাঠ সহকারী', union: '০৬. বেতাগী ইউনিয়ন', emailPrefix: 'officer06' },
  { index: 7, name: 'মাহবুবুর রহমান', designation: 'মাঠ সহকারী', union: '০৭. চন্দ্রঘোনা-কদমতলী ইউনিয়ন', emailPrefix: 'officer07' },
  { index: 8, name: 'আব্দুল কাদের', designation: 'মাঠ সহকারী', union: '০৮. মরিয়মনগর ইউনিয়ন', emailPrefix: 'officer08' },
  { index: 9, name: 'কামাল হোসেন', designation: 'মাঠ সহকারী', union: '০৯. ইসলামপুর ইউনিয়ন', emailPrefix: 'officer09' },
  { index: 10, name: 'সেলিম রেজা', designation: 'মাঠ সহকারী', union: '১০. স্বনির্ভর রাঙ্গুনিয়া ইউনিয়ন', emailPrefix: 'officer10' },
  { index: 11, name: 'মিজানুর রহমান', designation: 'মাঠ সহকারী', union: '১১. লালানগর ইউনিয়ন', emailPrefix: 'officer11' },
  { index: 12, name: 'হারুনুর রশিদ', designation: 'মাঠ সহকারী', union: '১২. সরফভাটা ইউনিয়ন', emailPrefix: 'officer12' },
  { index: 13, name: 'মনিরুল ইসলাম', designation: 'মাঠ সহকারী', union: '১৩. শিলক ইউনিয়ন', emailPrefix: 'officer13' },
  { index: 14, name: 'আকতার হোসেন', designation: 'মাঠ সহকারী', union: '১৪. পদুয়া ইউনিয়ন', emailPrefix: 'officer14' },
  { index: 15, name: 'নাসির উদ্দিন', designation: 'মাঠ সহকারী', union: '১৫. কোদালা ইউনিয়ন', emailPrefix: 'officer15' },
  { index: 16, name: 'তৌহিদুল ইসলাম', designation: 'মাঠ সহকারী', union: '১৬. রাঙ্গুনিয়া পৌরসভা', emailPrefix: 'officer16' },
  { index: 17, name: 'আনোয়ার হোসেন', designation: 'ফিল্ড অফিসার', union: '০৫. পোমরা ইউনিয়ন (অতিরিক্ত)', emailPrefix: 'officer17' },
  { index: 18, name: 'মোস্তফা কামাল', designation: 'মাঠ সহকারী', union: '০৭. চন্দ্রঘোনা-কদমতলী ইউনিয়ন (২)', emailPrefix: 'officer18' },
  { index: 19, name: 'ফারুক আহমেদ', designation: 'মাঠ সহকারী', union: '০৬. বেতাগী ইউনিয়ন (দক্ষিণ)', emailPrefix: 'officer19' },
  { index: 20, name: 'আব্দুর রহিম', designation: 'মাঠ সহকারী', union: '১২. সরফভাটা ইউনিয়ন (পূর্ব)', emailPrefix: 'officer20' },
  { index: 21, name: 'শফিউল আলম', designation: 'মাঠ সহকারী', union: '০৪. পারুয়া ইউনিয়ন (উত্তর)', emailPrefix: 'officer21' },
  { index: 22, name: 'সাইফুল ইসলাম', designation: 'মাঠ সহকারী', union: '০১. রাজানগর ইউনিয়ন (পূর্ব)', emailPrefix: 'officer22' },
  { index: 23, name: 'হাসান মাহমুদ', designation: 'মাঠ সহকারী', union: '১৪. পদুয়া ইউনিয়ন (দক্ষিণ)', emailPrefix: 'officer23' },
  { index: 24, name: 'আশরাফুল ইসলাম', designation: 'মাঠ সহকারী', union: '১৬. রাঙ্গুনিয়া পৌরসভা (২)', emailPrefix: 'officer24' },
  { index: 25, name: 'মহিউদ্দিন', designation: 'মাঠ সুপারভাইজার', union: 'উপজেলা সমন্বয়ক (সকল ইউনিয়ন)', emailPrefix: 'officer25' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  useEffect(() => {
    // Validate connection once on boot
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setSyncStatus('syncing');
    try {
      await signInWithPopup(auth, googleProvider);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Google Sign-in failed:', error);
      setSyncStatus('error');
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setSyncStatus('syncing');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Email Sign-in failed:', error);
      setSyncStatus('error');
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setSyncStatus('syncing');
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
      }
      setSyncStatus('synced');
    } catch (error) {
      console.error('Email sign up failed:', error);
      setSyncStatus('error');
      throw error;
    }
  };

  // Quick 1-click sign in for any of the 25 officers
  const quickLoginOfficer = async (officerIndex: number, officerName: string, unionName: string) => {
    setSyncStatus('syncing');
    const officerEmail = `officer${String(officerIndex).padStart(2, '0')}@psb-rangunia.gov.bd`;
    const officerPassword = `RanguniaPSB@2026_${officerIndex}`;

    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, officerEmail, officerPassword);
      setSyncStatus('synced');
    } catch (err: any) {
      // If user doesn't exist yet, create the account
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const res = await createUserWithEmailAndPassword(auth, officerEmail, officerPassword);
          if (res.user) {
            await updateProfile(res.user, {
              displayName: `${officerName} (${unionName.split('.')[1]?.trim() || unionName})`,
            });
          }
          setSyncStatus('synced');
        } catch (createErr) {
          console.error('Error auto-creating officer account:', createErr);
          setSyncStatus('error');
          throw createErr;
        }
      } else {
        throw err;
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseConnected,
        syncStatus,
        setSyncStatus,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        quickLoginOfficer,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useOfficerAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useOfficerAuth must be used within an AuthProvider');
  }
  return context;
};

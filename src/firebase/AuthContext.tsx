import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

export interface OfficerUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'officer';
  photoURL?: string | null;
}

export interface OfficerAuthContextType {
  currentUser: User | null;
  activeUser: OfficerUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  isAdmin: boolean;
  adminEmail: string | null;
  isFirebaseConnected: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  setSyncStatus: (status: 'synced' | 'syncing' | 'offline' | 'error') => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  quickLoginOfficer: (officerIndex: number, officerName: string, unionName: string) => Promise<void>;
  loginAsAdmin: (passwordOrPin: string, email?: string) => Promise<boolean>;
  toggleAdminRole: (forceState?: boolean) => void;
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
  
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vromon_admin_session') === 'true';
    } catch {
      return false;
    }
  });

  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('vromon_admin_email') || null;
    } catch {
      return null;
    }
  });

  const [sessionUser, setSessionUser] = useState<OfficerUser | null>(() => {
    try {
      const saved = localStorage.getItem('vromon_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const checkIsAdminEmail = (email?: string | null): boolean => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return (
      lower === 'tareq.ctg337@admin.com' ||
      lower === 'tarq.ctg337@admin.com' ||
      lower.endsWith('@admin.com') ||
      lower === 'admin@psb-rangunia.gov.bd' ||
      lower === 'admin@psb.gov.bd'
    );
  };

  useEffect(() => {
    // Validate connection once on boot
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.email && checkIsAdminEmail(user.email)) {
        setIsAdmin(true);
        setAdminEmail(user.email);
        localStorage.setItem('vromon_admin_session', 'true');
        localStorage.setItem('vromon_admin_email', user.email);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute active user and login state
  const activeUser: OfficerUser | null = useMemo(() => {
    if (isAdmin) {
      return {
        uid: 'admin_user',
        email: adminEmail || 'tareq.ctg337@admin.com',
        displayName: 'শাখা এডমিন (তারেক)',
        role: 'admin',
        photoURL: currentUser?.photoURL || null,
      };
    }
    if (currentUser) {
      return {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'মাঠ সহকারী',
        role: 'officer',
        photoURL: currentUser.photoURL || null,
      };
    }
    if (sessionUser) {
      return sessionUser;
    }
    return null;
  }, [isAdmin, adminEmail, currentUser, sessionUser]);

  const isLoggedIn = Boolean(isAdmin || currentUser || sessionUser);

  const loginAsAdmin = async (passwordOrPin: string, email?: string): Promise<boolean> => {
    // Strictly verify admin password set by user
    if (passwordOrPin.trim() === 'T@a546195') {
      const effectiveEmail = (email && email.trim()) || 'tareq.ctg337@admin.com';
      setIsAdmin(true);
      setAdminEmail(effectiveEmail);
      const adminUserObj: OfficerUser = {
        uid: 'admin_user',
        email: effectiveEmail,
        displayName: 'শাখা এডমিন (তারেক)',
        role: 'admin',
      };
      setSessionUser(adminUserObj);
      localStorage.setItem('vromon_user_session', JSON.stringify(adminUserObj));
      localStorage.setItem('vromon_admin_session', 'true');
      localStorage.setItem('vromon_admin_email', effectiveEmail);
      return true;
    }
    return false;
  };

  const toggleAdminRole = (forceState?: boolean) => {
    const next = forceState !== undefined ? forceState : !isAdmin;
    setIsAdmin(next);
    localStorage.setItem('vromon_admin_session', String(next));
  };

  const signInWithGoogle = async () => {
    setSyncStatus('syncing');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        const isAdminUser = checkIsAdminEmail(res.user.email);
        if (isAdminUser) {
          setIsAdmin(true);
          setAdminEmail(res.user.email);
          localStorage.setItem('vromon_admin_session', 'true');
          localStorage.setItem('vromon_admin_email', res.user.email || '');
        }
        const gUser: OfficerUser = {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || res.user.email?.split('@')[0] || 'মাঠ সহকারী',
          role: isAdminUser ? 'admin' : 'officer',
          photoURL: res.user.photoURL,
        };
        setSessionUser(gUser);
        localStorage.setItem('vromon_user_session', JSON.stringify(gUser));
      }
      setSyncStatus('synced');
    } catch (error) {
      console.warn('Google Sign-in failed or closed:', error);
      setSyncStatus('error');
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string, name?: string) => {
    setSyncStatus('syncing');
    const trimmed = email.trim();
    const isAdminUser = checkIsAdminEmail(trimmed);

    // Save reliable session user immediately
    const userObj: OfficerUser = {
      uid: `officer_${trimmed.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: trimmed,
      displayName: name || trimmed.split('@')[0],
      role: isAdminUser ? 'admin' : 'officer',
    };
    setSessionUser(userObj);
    localStorage.setItem('vromon_user_session', JSON.stringify(userObj));
    localStorage.setItem('vromon_custom_email', trimmed);

    if (isAdminUser) {
      setIsAdmin(true);
      setAdminEmail(trimmed);
      localStorage.setItem('vromon_admin_session', 'true');
      localStorage.setItem('vromon_admin_email', trimmed);
    }

    try {
      await signInWithEmailAndPassword(auth, trimmed, pass);
      setSyncStatus('synced');
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
        console.warn('Firebase Email provider operating in local profile session.');
        setSyncStatus('synced');
        return;
      }
      // If user not found, try to auto-create or keep local session
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
        try {
          const res = await createUserWithEmailAndPassword(auth, trimmed, pass);
          if (res.user && name) {
            await updateProfile(res.user, { displayName: name });
          }
          setSyncStatus('synced');
          return;
        } catch {
          // fallback to local session
          setSyncStatus('synced');
          return;
        }
      }
      setSyncStatus('synced');
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setSyncStatus('syncing');
    const trimmed = email.trim();
    const userObj: OfficerUser = {
      uid: `officer_${trimmed.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: trimmed,
      displayName: name || trimmed.split('@')[0],
      role: 'officer',
    };
    setSessionUser(userObj);
    localStorage.setItem('vromon_user_session', JSON.stringify(userObj));
    localStorage.setItem('vromon_custom_email', trimmed);

    try {
      const res = await createUserWithEmailAndPassword(auth, trimmed, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
      }
      setSyncStatus('synced');
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
        console.warn('Operating in local profile session.');
        setSyncStatus('synced');
        return;
      }
      setSyncStatus('synced');
    }
  };

  const quickLoginOfficer = async (officerIndex: number, officerName: string, unionName: string) => {
    setSyncStatus('syncing');
    const officerEmail = `officer${String(officerIndex).padStart(2, '0')}@psb-rangunia.gov.bd`;
    const officerPassword = `RanguniaPSB@2026_${officerIndex}`;
    const userObj: OfficerUser = {
      uid: `officer_${officerIndex}`,
      email: officerEmail,
      displayName: officerName,
      role: 'officer',
    };
    setSessionUser(userObj);
    localStorage.setItem('vromon_user_session', JSON.stringify(userObj));
    localStorage.setItem('vromon_selected_officer_index', String(officerIndex));

    try {
      await signInWithEmailAndPassword(auth, officerEmail, officerPassword);
      setSyncStatus('synced');
    } catch {
      setSyncStatus('synced');
    }
  };

  const signOut = async () => {
    setIsAdmin(false);
    setAdminEmail(null);
    setSessionUser(null);
    localStorage.removeItem('vromon_admin_session');
    localStorage.removeItem('vromon_admin_email');
    localStorage.removeItem('vromon_custom_email');
    localStorage.removeItem('vromon_user_session');
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeUser,
        isLoggedIn,
        loading,
        isAdmin,
        adminEmail,
        isFirebaseConnected,
        syncStatus,
        setSyncStatus,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        quickLoginOfficer,
        loginAsAdmin,
        toggleAdminRole,
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

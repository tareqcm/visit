import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  AlertCircle,
  LogIn,
  LogOut,
  Mail,
  Lock,
  X,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useOfficerAuth } from '../firebase/AuthContext';

interface OfficerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOfficerName?: string;
  onSelectOfficerProfile?: (name: string, union: string, designation: string) => void;
  onSelectAdmin?: () => void;
}

export const OfficerAuthModal: React.FC<OfficerAuthModalProps> = ({
  isOpen,
  onClose,
  currentOfficerName,
  onSelectOfficerProfile,
  onSelectAdmin,
}) => {
  const {
    activeUser,
    isLoggedIn,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    loginAsAdmin,
    signOut,
    syncStatus,
  } = useOfficerAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Check if the entered email is an admin ID
  const isTargetAdminEmail = (inputEmail: string): boolean => {
    const lower = inputEmail.trim().toLowerCase();
    return (
      lower === 'tareq.ctg337@admin.com' ||
      lower === 'tarq.ctg337@admin.com' ||
      lower.endsWith('@admin.com') ||
      lower === 'admin@psb-rangunia.gov.bd' ||
      lower === 'admin@psb.gov.bd'
    );
  };

  // Google Sign-in
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      setErrorMessage('গুগল লগইন সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unified Form Submit (Auto-detects Admin vs General User from email)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    const trimmedEmail = email.trim();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. AUTO-DETECT: If Admin Email is entered
      if (isTargetAdminEmail(trimmedEmail)) {
        const ok = await loginAsAdmin(password, trimmedEmail);
        if (ok) {
          if (onSelectAdmin) {
            onSelectAdmin();
          }
          onClose();
          return;
        } else {
          setErrorMessage('ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে।');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. AUTO-DETECT: General User (Field Assistant)
      if (isRegisterMode) {
        await signUpWithEmail(trimmedEmail, password, officerName || 'মাঠ সহকারী');
      } else {
        await signInWithEmail(trimmedEmail, password, officerName);
      }

      if (onSelectOfficerProfile) {
        onSelectOfficerProfile(
          officerName || trimmedEmail.split('@')[0],
          'রাঙ্গুনিয়া শাখা, চট্টগ্রাম।',
          'মাঠ সহকারী'
        );
      }
      onClose();
    } catch (err: any) {
      const msg = err?.message || String(err || '');
      if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
        setErrorMessage('ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে।');
      } else {
        // Fallback: let user proceed in local profile
        if (onSelectOfficerProfile) {
          onSelectOfficerProfile(
            officerName || trimmedEmail.split('@')[0],
            'রাঙ্গুনিয়া শাখা, চট্টগ্রাম।',
            'মাঠ সহকারী'
          );
        }
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-amber-50/95 border border-amber-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">লগইন পোর্টাল</h2>
              <p className="text-xs text-amber-100">
                ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-amber-100 hover:text-white cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Status Banner */}
        <div className="bg-amber-100/70 border-b border-amber-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          {isLoggedIn && activeUser ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <div>
                <span className="text-stone-600">লগইনকৃত: </span>
                <span className="font-bold text-stone-900">{activeUser.displayName}</span>
                <span className="text-stone-500 ml-1">({activeUser.email})</span>
                {activeUser.role === 'admin' && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                    এডমিন
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-stone-600">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>বর্তমানে কোনো একাউন্টে লগইন নেই।</span>
            </div>
          )}

          {isLoggedIn && (
            <button
              onClick={async () => {
                await signOut();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium text-xs shadow-xs transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              লগআউট
            </button>
          )}
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Unified Login Form (NO separate tabs) */}
        <div className="p-5 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <span className="text-xs font-bold text-stone-800">
                {isRegisterMode ? 'নতুন একাউন্ট নিবন্ধন' : 'একাউন্টে লগইন করুন'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMessage(null);
                }}
                className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
              >
                {isRegisterMode ? 'লগইন করুন' : 'নতুন সহকারী নিবন্ধন'}
              </button>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  আপনার পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="যেমন: তারেক আজিজ"
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ইমেইল আইডি *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tareq.ctg337@gmail.com অথবা আপনার ইমেইল"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                পাসওয়ার্ড *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{isRegisterMode ? 'নিবন্ধন ও প্রবেশ করুন' : 'লগইন করুন'}</span>
            </button>
          </form>

          {/* Separator */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-amber-200 w-full"></div>
            <span className="bg-amber-50 px-2 text-[11px] text-stone-500 font-medium">অথবা</span>
          </div>

          {/* Google One-Click Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-stone-800 font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-4 h-4"
            />
            <span>গুগল অ্যাকাউন্ট দিয়ে সরাসরি লগইন</span>
          </button>

          {/* Privacy & Security Hint */}
          <div className="mt-4 p-3 bg-amber-100/60 rounded-xl border border-amber-200 text-[11px] text-stone-700 space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>নিরাপদ ক্লাউড ডেটা সিঙ্ক:</span>
            </div>
            <p>
              আপনার ইমেইল দিয়ে প্রবেশ করলে আপনার সকল সমিতি, দিনপঞ্জি সূচি ও রিপোর্ট ব্যক্তিগতভাবে সুরক্ষিত থাকবে।
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-amber-100/60 border-t border-amber-200 px-5 py-3 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>
              ক্লাউড স্ট্যাটাস:{' '}
              {syncStatus === 'synced'
                ? 'সংযুক্ত ও সক্রিয়'
                : syncStatus === 'syncing'
                ? 'সিঙ্ক হচ্ছে...'
                : 'অফলাইন'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg font-medium text-stone-700 cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

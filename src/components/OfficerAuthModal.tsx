import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Mail,
  Lock,
  UserCheck,
  X,
  Sparkles,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useOfficerAuth, PRESET_OFFICERS } from '../firebase/AuthContext';
import { toBengaliNumber } from '../utils/bengaliNumerals';

interface OfficerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOfficerProfile?: (name: string, union: string, designation: string) => void;
}

export const OfficerAuthModal: React.FC<OfficerAuthModalProps> = ({
  isOpen,
  onClose,
  onSelectOfficerProfile,
}) => {
  const {
    currentUser,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    quickLoginOfficer,
    signOut,
    syncStatus,
  } = useOfficerAuth();

  const [activeTab, setActiveTab] = useState<'preset' | 'google' | 'custom'>('preset');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredOfficers = PRESET_OFFICERS.filter(
    (off) =>
      off.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      off.union.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toBengaliNumber(off.index).includes(searchQuery)
  );

  const handleQuickLogin = async (officer: typeof PRESET_OFFICERS[0]) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await quickLoginOfficer(officer.index, officer.name, officer.union);
      if (onSelectOfficerProfile) {
        onSelectOfficerProfile(officer.name, officer.union, officer.designation);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'লগইন করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'গুগল লগইন সম্পন্ন করা যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isRegisterMode) {
        await signUpWithEmail(email, password, officerName || 'মাঠ সহকারী');
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'অনুরোধ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-amber-50/95 border border-amber-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">অফিসার অ্যাকাউন্ট ও ক্লাউড ডেটাবেস</h2>
              <p className="text-xs text-amber-100">
                রাঙ্গুনিয়া উপজেলার ২৫ জন অফিসারের সম্পূর্ণ পৃথক ও সুরক্ষিত প্রোফাইল
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-amber-100 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Status Banner */}
        <div className="bg-amber-100/70 border-b border-amber-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <span className="text-stone-600">লগইনকৃত অফিসার: </span>
                <span className="font-bold text-stone-900">{currentUser.displayName || currentUser.email}</span>
                <span className="ml-2 text-[10px] text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded font-mono">
                  UID: {currentUser.uid.substring(0, 8)}...
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-stone-600">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>বর্তমানে কোনো অফিসার অ্যাকাউন্টে লগইন নেই (স্থানীয় মোড)।</span>
            </div>
          )}

          {currentUser && (
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium text-xs shadow-xs transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              লগআউট / পরিবর্তন
            </button>
          )}
        </div>

        {/* Security / Isolation Assurance */}
        <div className="px-5 py-2.5 bg-yellow-50/90 border-b border-amber-200/60 flex items-center gap-2 text-xs text-amber-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>শতভাগ ডেটা আইসোলেশন:</strong> ফায়ারবেস ক্লাউডের মাধ্যমে প্রতিটি অফিসারের সমিতি, দিনপঞ্জি, ছবি ও
            স্বাক্ষর সম্পূর্ণ গোপন ও ইউনিক রাখা হয়। একজনের তথ্য অন্যের সাথে মিলবে না।
          </span>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-amber-200 px-5 pt-3 gap-2 bg-amber-100/40">
          <button
            onClick={() => setActiveTab('preset')}
            className={`pb-2.5 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'preset'
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            ২৫ জন অফিসারের তালিকা ({toBengaliNumber(PRESET_OFFICERS.length)})
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`pb-2.5 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'google'
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            গুগল লগইন (Google)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            ইমেইল ও পাসওয়ার্ড
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-stone-600">
                  আপনার নাম বা ইউনিয়ন নির্বাচন করে এক ক্লিকে সরাসরি আপনার ব্যক্তিগত সুরক্ষিত ডেটাবেসে প্রবেশ করুন:
                </p>
                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="অফিসার বা ইউনিয়ন খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto pr-1">
                {filteredOfficers.map((officer) => {
                  const isCurrent = currentUser?.displayName?.includes(officer.name);
                  return (
                    <div
                      key={officer.index}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-500'
                          : 'bg-white hover:bg-amber-50/80 border-amber-200/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                            #{toBengaliNumber(officer.index)}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">{officer.name}</h4>
                        </div>
                        <p className="text-[11px] text-amber-800 font-medium truncate mt-0.5">{officer.union}</p>
                        <p className="text-[10px] text-stone-500">{officer.designation} • পল্লী সঞ্চয় ব্যাংক</p>
                      </div>

                      <button
                        onClick={() => handleQuickLogin(officer)}
                        disabled={isSubmitting}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            সক্রিয়
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5" />
                            প্রবেশ
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'google' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center border border-amber-300 shadow-inner">
                <Sparkles className="w-8 h-8 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">গুগল অ্যাকাউন্টের মাধ্যমে সাইন-ইন</h3>
                <p className="text-xs text-stone-600 mt-1">
                  আপনার ব্যক্তিগত জিমেইল (যেমন: <span className="font-mono font-semibold">tareq.ctg337@gmail.com</span>)
                  দিয়ে সাইন ইন করুন। আপনার অ্যাকাউন্টে সমস্ত ভ্রমণ রিপোর্ট, সমিতি এবং স্থিরচিত্র ক্লাউডে স্বয়ংক্রিয়ভাবে
                  সংরক্ষিত থাকবে।
                </p>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl font-semibold text-sm shadow-md transition hover:shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                গুগল দিয়ে সরাসরি প্রবেশ করুন
              </button>
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleCustomAuth} className="space-y-3.5 max-w-md mx-auto py-2">
              <div className="flex justify-center mb-2">
                <div className="bg-amber-100 p-1 rounded-xl flex text-xs">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(false)}
                    className={`px-4 py-1.5 rounded-lg font-medium transition ${
                      !isRegisterMode ? 'bg-amber-700 text-white shadow-xs' : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    লগইন
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(true)}
                    className={`px-4 py-1.5 rounded-lg font-medium transition ${
                      isRegisterMode ? 'bg-amber-700 text-white shadow-xs' : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    নতুন অ্যাকাউন্ট তৈরি
                  </button>
                </div>
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">অফিসারের পূর্ণ নাম</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="যেমন: তারেক আজিজ"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">ইমেইল ঠিকানা</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@domain.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">পাসওয়ার্ড</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50 mt-2"
              >
                {isRegisterMode ? 'অ্যাকাউন্ট নিবন্ধন করুন' : 'সাইন-ইন করুন'}
              </button>
            </form>
          )}
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
            className="px-4 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg font-medium text-stone-700"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

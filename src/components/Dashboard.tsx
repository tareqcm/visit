import React, { useMemo } from 'react';
import { ActiveTab, OfficerInfo, Samity, FieldPhoto, WorkingDay, SavedMonthlyReport } from '../types';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Camera,
  Building2,
  Settings,
  FolderArchive,
  Users,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  MapPin,
  FileDown,
  Download,
  ChevronRight,
  UserCheck,
  CalendarDays,
  LogOut,
  LogIn,
} from 'lucide-react';
import {
  toBengaliNumber,
  formatBengaliMonthYear,
} from '../utils/bengaliNumerals';
import { PRESET_OFFICERS, useOfficerAuth } from '../firebase/AuthContext';

interface DashboardProps {
  officerInfo: OfficerInfo;
  samities: Samity[];
  photos: FieldPhoto[];
  days: WorkingDay[];
  savedReports: SavedMonthlyReport[];
  signatureUrl: string;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAuthModal: () => void;
  onOpenSignatureModal: () => void;
  onDownloadPDF: () => void;
  onPrint: () => void;
  onSaveReport: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  isDownloading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  officerInfo,
  samities,
  photos,
  days,
  savedReports,
  signatureUrl,
  onTabChange,
  onOpenAuthModal,
  onDownloadPDF,
  onSaveReport,
  onMonthChange,
  onYearChange,
  isDownloading,
}) => {
  const { activeUser, isLoggedIn, currentUser, isAdmin, signOut, toggleAdminRole } = useOfficerAuth();

  // Dynamic Bengali greeting based on client time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'শুভ সকাল';
    if (hour >= 12 && hour < 15) return 'শুভ দুপুর';
    if (hour >= 15 && hour < 18) return 'শুভ অপরাহ্ন';
    return 'শুভ সন্ধ্যা';
  }, []);

  // Calculate key statistics
  const workingDays = useMemo(() => days.filter((d) => !d.isHoliday), [days]);
  const holidays = useMemo(() => days.filter((d) => d.isHoliday), [days]);
  const activeSamities = useMemo(() => samities.filter((s) => s.active), [samities]);
  const uniqueUnions = useMemo(() => {
    const set = new Set<string>();
    samities.forEach((s) => {
      if (s.unionName) set.add(s.unionName);
    });
    return Array.from(set);
  }, [samities]);

  // Check audit readiness (Checklist for report submission)
  const checklist = useMemo(() => {
    const hasOfficerInfo = Boolean(officerInfo.officerName && officerInfo.branchName && officerInfo.designation);
    const hasSmarok = Boolean(officerInfo.smarokNo && officerInfo.smarokDate);
    const hasDaysAssigned = workingDays.length > 0 && workingDays.every((d) => Boolean(d.samityName));
    const hasPhotos = photos.length >= 2;
    const hasSignature = Boolean(signatureUrl && signatureUrl.length > 30);

    const items = [
      {
        id: 'officer',
        title: 'কর্মকর্তা ও শাখা পরিচিতি',
        desc: `${officerInfo.officerName || 'অনির্ধারিত'} • ${officerInfo.designation || ''}`,
        passed: hasOfficerInfo,
        tab: 'settings' as ActiveTab,
      },
      {
        id: 'smarok',
        title: 'অনুমোদন স্মারক নম্বর ও তারিখ',
        desc: officerInfo.smarokNo ? `স্মারক: ${officerInfo.smarokNo}` : 'স্মারক নম্বর উল্লেখ করুন',
        passed: hasSmarok,
        tab: 'settings' as ActiveTab,
      },
      {
        id: 'schedule',
        title: 'কার্যদিবসে সমিতি বণ্টন',
        desc: `${toBengaliNumber(workingDays.length)} কার্যদিবসে সফর নির্ধারিত`,
        passed: hasDaysAssigned,
        tab: 'calendar' as ActiveTab,
      },
      {
        id: 'photos',
        title: 'মাঠ পরিদর্শনের রঙিন ছবি',
        desc: `${toBengaliNumber(photos.length)}টি ছবি সংযোজিত (ন্যূনতম ২টি)`,
        passed: hasPhotos,
        tab: 'photos' as ActiveTab,
      },
      {
        id: 'signature',
        title: 'ডিজিটাল স্বাক্ষর ও সিল',
        desc: hasSignature ? 'স্বাক্ষর প্রস্তুত রয়েছে' : 'স্বাক্ষর যুক্ত করুন',
        passed: hasSignature,
        tab: 'settings' as ActiveTab,
      },
    ];

    const passedCount = items.filter((i) => i.passed).length;
    const percentage = Math.round((passedCount / items.length) * 100);

    return { items, passedCount, percentage };
  }, [officerInfo, workingDays, photos, signatureUrl]);

  // Next 5 upcoming working visits
  const upcomingVisits = useMemo(() => {
    return workingDays.slice(0, 5);
  }, [workingDays]);

  // Month options for quick switcher
  const monthsBengali = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  return (
    <div className="space-y-2.5 sm:space-y-4 pb-20 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* 1. COMPACT HERO BAR (Reduced size per user request) */}
      <section className="rounded-xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white shadow-xs border border-amber-500/30 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Officer and branch */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
              <span>
                {isAdmin
                  ? (activeUser?.displayName || 'শাখা এডমিন')
                  : (officerInfo.officerName || activeUser?.displayName || 'মাঠ সহকারী')}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                {officerInfo.designation || 'মাঠ সহকারী'}
              </span>
            </div>
            <div className="text-[10px] text-stone-300 truncate">
              {officerInfo.branchName || 'রাঙ্গুনিয়া শাখা, চট্টগ্রাম।'}
            </div>
          </div>
        </div>

        {/* Right: Compact Month/Year Selector & Action Icon Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Month / Year Picker */}
          <div className="flex items-center bg-black/40 px-2 py-1 rounded-lg border border-amber-500/30 text-xs text-white">
            <select
              value={officerInfo.month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="bg-transparent text-amber-200 text-xs font-semibold focus:outline-hidden cursor-pointer pr-1"
            >
              {monthsBengali.map((m, idx) => (
                <option key={idx} value={idx} className="bg-stone-900 text-white">
                  {m}
                </option>
              ))}
            </select>
            <span className="text-stone-500 mx-0.5">/</span>
            <select
              value={officerInfo.year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="bg-transparent text-amber-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y} className="bg-stone-900 text-white">
                  {toBengaliNumber(y)}
                </option>
              ))}
            </select>
          </div>

          {/* PDF Download: ONLY Download Icon button */}
          <button
            onClick={onDownloadPDF}
            disabled={isDownloading}
            title={isDownloading ? 'পিডিএফ তৈরি হচ্ছে...' : 'পিডিএফ ডাউনলোড করুন'}
            className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shadow-xs transition active:scale-95 disabled:opacity-75 cursor-pointer border border-amber-500"
          >
            {isDownloading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* Save Button: Compact Icon button */}
          <button
            onClick={onSaveReport}
            title="বর্তমান মাসের ডাটা সংরক্ষণ করুন"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 border border-white/20 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4" />
          </button>

          {/* Login / Logout Button */}
          {isLoggedIn ? (
            <button
              onClick={signOut}
              title="একাউন্ট থেকে লগআউট করুন"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span>লগআউট</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="একাউন্টে লগইন করুন"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300" />
              <span>লগইন</span>
            </button>
          )}
        </div>
      </section>

      {/* Supervisor Admin Banner (Visible if admin or quick access) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white rounded-xl p-3 border border-amber-500/50 flex items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200">সুপারভাইজার এডমিন প্যানেল সক্রিয়</div>
              <div className="text-[11px] text-stone-300">রাঙ্গুনিয়া উপজেলার সকল ২৫ জন মাঠ সহকারীর সমিতি ও রিপোর্ট পর্যবেক্ষণ করুন</div>
            </div>
          </div>
          <button
            onClick={() => onTabChange('admin')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg shrink-0 transition shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>এডমিন প্যানেলে যান</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. STATS OVERVIEW CARDS (Compact 2x2 Grid on Mobile) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* KPI 1: Working Days */}
        <div
          onClick={() => onTabChange('calendar')}
          className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-200/90 shadow-2xs hover:border-amber-400 active:scale-[0.98] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 truncate">কার্যদিবস ও সফর</span>
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-xl font-bold text-stone-900 leading-tight">
              {toBengaliNumber(workingDays.length)} <span className="text-[10px] font-normal text-stone-500">দিন</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
              ছুটি: {toBengaliNumber(holidays.length)} দিন • সফর ১০০%
            </div>
          </div>
        </div>

        {/* KPI 2: Samities */}
        <div
          onClick={() => onTabChange('samities')}
          className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-200/90 shadow-2xs hover:border-amber-400 active:scale-[0.98] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 truncate">সমিতি ও ইউনিয়ন</span>
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-xl font-bold text-stone-900 leading-tight">
              {toBengaliNumber(activeSamities.length)} <span className="text-[10px] font-normal text-stone-500">সমিতি</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
              {toBengaliNumber(uniqueUnions.length || 1)}টি ইউনিয়ন কভারেজ
            </div>
          </div>
        </div>

        {/* KPI 3: Photos */}
        <div
          onClick={() => onTabChange('photos')}
          className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-200/90 shadow-2xs hover:border-amber-400 active:scale-[0.98] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 truncate">পরিদর্শন ছবি</span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-xl font-bold text-stone-900 leading-tight">
              {toBengaliNumber(photos.length)} <span className="text-[10px] font-normal text-stone-500">টি ছবি</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
              তারিখ ও সিলসহ সংযুক্ত
            </div>
          </div>
        </div>

        {/* KPI 4: Archive */}
        <div
          onClick={() => onTabChange('archive')}
          className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-200/90 shadow-2xs hover:border-amber-400 active:scale-[0.98] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 truncate">সংরক্ষিত রিপোর্ট</span>
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <FolderArchive className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-xl font-bold text-stone-900 leading-tight">
              {toBengaliNumber(savedReports.length)} <span className="text-[10px] font-normal text-stone-500">টি মাস</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
              আর্কাইভ ও হিস্ট্রি
            </div>
          </div>
        </div>
      </section>

      {/* 3. ALL APP MENUS / NAVIGATION HUB (Compact 2-Column Grid on Mobile) */}
      <section className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4 text-amber-700" />
            <span>সকল মেনু ও অ্যাপ্লিকেশন মডিউলসমূহ</span>
          </h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            ৭টি মডিউল
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {/* MENU 1: Report Preview */}
          <div
            onClick={() => onTabChange('preview')}
            className="bg-white rounded-xl p-2.5 sm:p-3 border border-stone-200 shadow-2xs hover:border-amber-400 active:scale-[0.98] transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  চূড়ান্ত ভিউ
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-1.5 leading-snug group-hover:text-amber-700 transition">
                HTML View (রিপোর্ট)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-tight">
                এ৪ সাইজের রিপোর্ট ভিউ, যেখান থেকে সরাসরি প্রিন্ট ও সংরক্ষণ করা যাবে।
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-stone-400 truncate">
                {formatBengaliMonthYear(officerInfo.month, officerInfo.year)}
              </span>
              <span className="font-bold text-amber-800 flex items-center">
                খুলুন <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* MENU 2: Calendar & Schedule */}
          <div
            onClick={() => onTabChange('calendar')}
            className="bg-white rounded-xl p-2.5 sm:p-3 border border-stone-200 shadow-2xs hover:border-blue-400 active:scale-[0.98] transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                  {toBengaliNumber(workingDays.length)} দিন
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-1.5 leading-snug group-hover:text-blue-700 transition">
                ক্যালেন্ডার ও সফর
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-tight">
                ছুটির দিন ও সমিতি বণ্টন, মন্তব্য সংযোজন এবং অটো রোস্টার।
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-stone-400 truncate">
                ছুটি: {toBengaliNumber(holidays.length)}
              </span>
              <span className="font-bold text-blue-800 flex items-center">
                খুলুন <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* MENU 3: Field Photos */}
          <div
            onClick={() => onTabChange('photos')}
            className="bg-white rounded-xl p-2.5 sm:p-3 border border-stone-200 shadow-2xs hover:border-emerald-400 active:scale-[0.98] transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {toBengaliNumber(photos.length)}টি ছবি
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-1.5 leading-snug group-hover:text-emerald-700 transition">
                মাঠ পরিদর্শন ছবি
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-tight">
                ক্যাপশন ও স্বয়ংক্রিয় টাইমস্ট্যাম্পসহ রঙিন আলোকচিত্র আপলোড।
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-stone-400 truncate">প্রমাণক</span>
              <span className="font-bold text-emerald-800 flex items-center">
                খুলুন <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* MENU 4: Samities & Unions */}
          <div
            onClick={() => onTabChange('samities')}
            className="bg-white rounded-xl p-2.5 sm:p-3 border border-stone-200 shadow-2xs hover:border-amber-400 active:scale-[0.98] transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  {toBengaliNumber(samities.length)}টি
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-1.5 leading-snug group-hover:text-amber-700 transition">
                সমিতি ও ইউনিয়ন
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-tight">
                ইউনিয়ন ভিত্তিক সমিতি ডাটাবেজ, নতুন সমিতি ও স্থিতি নিয়ন্ত্রণ।
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-stone-400 truncate">
                সক্রিয় {toBengaliNumber(activeSamities.length)}
              </span>
              <span className="font-bold text-amber-800 flex items-center">
                খুলুন <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* MENU 5: Officer Settings & Digital Signature */}
          <div
            onClick={() => onTabChange('settings')}
            className="bg-white rounded-xl p-2.5 sm:p-3 border border-stone-200 shadow-2xs hover:border-purple-400 active:scale-[0.98] transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                  প্রোফাইল
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-1.5 leading-snug group-hover:text-purple-700 transition">
                অফিসার ও স্বাক্ষর
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-tight">
                শাখার নাম, পদবি, স্মারক নম্বর এবং ডিজিটাল ক্যানভাসে স্বাক্ষর।
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-stone-400 truncate max-w-[80px]">
                {officerInfo.officerName || 'তথ্য'}
              </span>
              <span className="font-bold text-purple-800 flex items-center">
                খুলুন <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* MENU 6: Saved Reports Archive */}
          <div
            onClick={() => onTabChange('archive')}
            className="bg-white rounded-xl p-2.5 sm:p-3 border border-stone-200 shadow-2xs hover:border-teal-400 active:scale-[0.98] transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                  {toBengaliNumber(savedReports.length)}টি সেভ
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-1.5 leading-snug group-hover:text-teal-700 transition">
                আর্কাইভ ও হিস্ট্রি
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-tight">
                বিগত মাসের সেভকৃত রিপোর্ট ব্রাউজ ও যেকোনো সময় পুনঃমুদ্রণ।
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-stone-400 truncate">পূর্ববর্তী মাস</span>
              <span className="font-bold text-teal-800 flex items-center">
                খুলুন <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CURRENT MONTH SCHEDULE & AUDIT CHECKLIST (Compact Mobile Layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Left 2 Cols: Immediate Schedule / Inspection Itinerary */}
        <div className="lg:col-span-2 bg-white rounded-xl p-2.5 sm:p-3.5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>মাঠ পরিদর্শনের সময়সূচি (প্রারম্ভিক দিনসমূহ)</span>
              </h3>
              <p className="text-[10px] text-stone-500">
                {formatBengaliMonthYear(officerInfo.month, officerInfo.year)} মাসের নির্ধারিত সফরসমূহ
              </p>
            </div>
            <button
              onClick={() => onTabChange('calendar')}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5"
            >
              <span>সকল {toBengaliNumber(days.length)} দিন</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-2 space-y-1.5">
            {upcomingVisits.length === 0 ? (
              <div className="py-6 text-center text-stone-500 text-xs">
                কোনো কার্যদিবস পাওয়া যায়নি। ক্যালেন্ডারে গিয়ে দিন বণ্টন করুন।
              </div>
            ) : (
              upcomingVisits.map((item) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-stone-50 hover:bg-amber-50/60 border border-stone-200/70 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-amber-100/90 text-amber-900 font-bold text-[11px] flex flex-col items-center justify-center shrink-0 border border-amber-200">
                      <span className="leading-none">{toBengaliNumber(item.dayOfMonth)}</span>
                      <span className="text-[8px] font-normal text-amber-800 leading-none">{item.dayNameBn}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        {item.samityName || 'সমিতি বরাদ্দ করুন'}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">
                        {item.unionName || officerInfo.branchName} • মাঠ পরিদর্শন
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    নির্ধারিত
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Audit & Submission Checklist */}
        <div className="bg-gradient-to-b from-white to-amber-50/40 rounded-xl p-2.5 sm:p-3.5 border border-amber-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/70">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>রিপোর্ট প্রস্তুতি অডিট</span>
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {toBengaliNumber(checklist.percentage)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${checklist.percentage}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="mt-2.5 space-y-1.5">
              {checklist.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onTabChange(item.tab)}
                  className="flex items-center justify-between p-1.5 rounded-md hover:bg-white/80 active:bg-amber-100/50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0">
                      {item.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-stone-800 truncate group-hover:text-amber-800 transition">
                        {item.title}
                      </div>
                      <div className="text-[9px] text-stone-500 truncate">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-stone-700 shrink-0 ml-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Finalize CTA */}
          <div className="mt-3 pt-2 border-t border-amber-200/80">
            <button
              onClick={() => onTabChange('preview')}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-2xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>রিপোর্ট প্রিভিউ ও চূড়ান্ত প্রিন্ট</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import { ActiveTab } from '../types';
import {
  FileDown,
  Printer,
  FileText,
  Calendar,
  Camera,
  Building2,
  Settings,
  BookmarkCheck,
  FolderArchive,
  UserCheck,
  Cloud,
  CloudCheck,
  RefreshCw,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { useOfficerAuth } from '../firebase/AuthContext';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onDownloadPDF: () => void;
  onPrint: () => void;
  onSaveReport: () => void;
  onOpenAuthModal: () => void;
  isDownloading: boolean;
  downloadProgressText?: string;
  savedReportsCount: number;
  currentOfficerName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onDownloadPDF,
  onPrint,
  onSaveReport,
  onOpenAuthModal,
  isDownloading,
  downloadProgressText,
  savedReportsCount,
  currentOfficerName,
}) => {
  const { currentUser, syncStatus } = useOfficerAuth();

  const tabs = [
    { id: 'preview', label: 'রিপোর্ট প্রিভিউ', icon: FileText },
    { id: 'calendar', label: 'ক্যালেন্ডার', icon: Calendar },
    { id: 'photos', label: 'ছবি আপলোড', icon: Camera },
    { id: 'samities', label: 'সমিতি ও ইউনিয়ন', icon: Building2 },
    { id: 'settings', label: 'অফিসার তথ্য', icon: Settings },
    { id: 'archive', label: 'সংরক্ষিত রিপোর্ট', icon: FolderArchive, badge: savedReportsCount },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-3">
          {/* Logo & Officer Switcher button */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-center shadow-xs shrink-0 border border-amber-300">
              <span className="font-extrabold text-sm sm:text-base tracking-tight font-serif">পসব</span>
            </div>

            {/* Officer Quick Account Pill Button */}
            <button
              onClick={onOpenAuthModal}
              title="অফিসার পরিবর্তন বা ক্লাউড সিঙ্ক স্থিতি দেখতে ক্লিক করুন"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 text-left transition group max-w-[170px] sm:max-w-[240px]"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-stone-900 truncate">
                    {currentUser?.displayName || currentOfficerName || 'অফিসার নির্বাচন'}
                  </span>
                  {currentUser ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="ফায়ারবেজ ক্লাউড সক্রিয়"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="স্থানীয় ডেটা মোড"></span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-amber-800">
                  {syncStatus === 'syncing' ? (
                    <span className="flex items-center gap-0.5 text-amber-700">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      সিঙ্ক হচ্ছে...
                    </span>
                  ) : currentUser ? (
                    <span className="truncate">২৫ জনের সুরক্ষিত ক্লাউড</span>
                  ) : (
                    <span className="text-stone-500 truncate">ক্লিক করে লগইন করুন</span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1 bg-amber-50/70 p-1 rounded-xl border border-amber-200/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-amber-900 shadow-xs border border-amber-200/80 font-bold'
                      : 'text-stone-600 hover:text-amber-950 hover:bg-amber-100/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {'badge' in tab && tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                      {toBengaliNumber(tab.badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons with Light Gold styling */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Save Report Button */}
            <button
              onClick={onSaveReport}
              title="বর্তমান মাসের রিপোর্ট ও ছবি আর্কাইভে সংরক্ষণ করুন"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-bold transition active:scale-95 shadow-xs"
            >
              <BookmarkCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-700" />
              <span>সেভ</span>
            </button>

            <button
              onClick={onPrint}
              title="প্রিন্ট করুন বা ব্রাউজার থেকে সেভ করুন"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition active:scale-95 shadow-xs"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span>প্রিন্ট</span>
            </button>

            <button
              onClick={onDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95 disabled:opacity-75 cursor-pointer border border-amber-500"
            >
              {isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>
                  <span className="truncate max-w-[100px] sm:max-w-none">
                    {downloadProgressText || 'তৈরি হচ্ছে...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="hidden sm:inline">পিডিএফ ডাউনলোড</span>
                  <span className="sm:hidden">পিডিএফ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

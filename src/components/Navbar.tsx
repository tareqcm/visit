import React from 'react';
import { ActiveTab } from '../types';
import {
  Download,
  Printer,
  FileText,
  Calendar,
  Camera,
  Building2,
  Settings,
  BookmarkCheck,
  FolderArchive,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  LogIn,
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
  currentDesignation?: string;
}

interface NavTabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
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
  currentDesignation,
}) => {
  const { activeUser, isLoggedIn, isAdmin, signOut } = useOfficerAuth();

  const tabs: NavTabItem[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'preview', label: 'HTML View', icon: FileText },
    { id: 'calendar', label: 'ক্যালেন্ডার', icon: Calendar },
    { id: 'photos', label: 'ছবি আপলোড', icon: Camera },
    { id: 'samities', label: 'সমিতি ও ইউনিয়ন', icon: Building2 },
    { id: 'settings', label: 'অফিসার তথ্য', icon: Settings },
    { id: 'archive', label: 'সংরক্ষিত রিপোর্ট', icon: FolderArchive, badge: savedReportsCount },
    ...(isAdmin ? [{ id: 'admin' as ActiveTab, label: 'এডমিন প্যানেল', icon: ShieldCheck }] : []),
  ];

  // For General Users: strictly display the actual Field Officer's name from officer settings
  const displayName = isAdmin
    ? (activeUser?.displayName || 'শাখা এডমিন')
    : (currentOfficerName || activeUser?.displayName || 'মাঠ সহকারী');

  const displayDesignation = isAdmin
    ? 'এডমিন পোর্টাল'
    : (currentDesignation || 'মাঠ সহকারী');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-3">
          {/* Left: App Logo & Branch Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => onTabChange('dashboard')}
              title="ড্যাশবোর্ডে ফিরে যান"
              className="w-9 h-9 rounded-xl overflow-hidden shadow-xs shrink-0 border border-amber-300/90 bg-emerald-950 transition hover:scale-105 cursor-pointer"
            >
              <img
                src="/icon.svg"
                alt="পল্লী সঞ্চয় ব্যাংক ভ্রমণ বিবরণী"
                className="w-full h-full object-cover"
              />
            </button>

            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-stone-900 truncate flex items-center gap-1.5">
                <span>পল্লী সঞ্চয় ব্যাংক</span>
              </h1>
              <p className="text-[10px] text-amber-800 font-medium truncate">
                রাঙ্গুনিয়া শাখা • ভ্রমণ বিবরণী
              </p>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs */}
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
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                      {toBengaliNumber(tab.badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions & User Profile Corner */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Save Report Button */}
            <button
              onClick={onSaveReport}
              title="বর্তমান মাসের রিপোর্ট ও ছবি আর্কাইভে সংরক্ষণ করুন"
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>সেভ</span>
            </button>

            {/* Print Button */}
            <button
              onClick={onPrint}
              title="প্রিন্ট করুন বা ব্রাউজার থেকে সেভ করুন"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition active:scale-95 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>প্রিন্ট</span>
            </button>

            {/* PDF Button: ONLY Download Icon as requested ("ছবির মত এত বড় আইকন লাগবে না শুধু ডাউনলোড আইকন চিহ্ন টি দেন") */}
            <button
              onClick={onDownloadPDF}
              disabled={isDownloading}
              title={downloadProgressText || 'পিডিএফ ডাউনলোড করুন'}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white flex items-center justify-center shadow-md transition active:scale-95 disabled:opacity-75 cursor-pointer border border-amber-500"
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4.5 h-4.5" />
              )}
            </button>

            {/* TOP-RIGHT USER PROFILE & LOGOUT CORNER */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-amber-300/80">
              {isLoggedIn && activeUser ? (
                <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200/90 rounded-xl p-1 sm:px-2 sm:py-1">
                  {/* Profile Photo / Avatar */}
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-amber-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-amber-300">
                    {activeUser.photoURL ? (
                      <img src={activeUser.photoURL} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{displayName.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Name and Designation */}
                  <div className="hidden sm:block text-left min-w-0 max-w-[105px] md:max-w-[145px]">
                    <div className="text-xs font-bold text-stone-900 truncate leading-tight" title={displayName}>
                      {displayName}
                    </div>
                    <div className="text-[10px] text-amber-800 font-medium truncate leading-tight" title={displayDesignation}>
                      {displayDesignation}
                    </div>
                  </div>

                  {/* Explicit Working Logout Button */}
                  <button
                    onClick={async () => {
                      await signOut();
                    }}
                    title="লগআউট করুন"
                    className="p-1 sm:p-1.5 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition ml-0.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
                  </button>
                </div>
              ) : (
                /* Prominent Login Button when not logged in */
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  title="লগইন করুন"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

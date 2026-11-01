import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ActiveTab, OfficerInfo, Samity, FieldPhoto, WorkingDay, SavedMonthlyReport } from './types';
import {
  DEFAULT_OFFICER_INFO,
  DEFAULT_SAMITIES,
  DEFAULT_PHOTOS,
  DEFAULT_SIGNATURE_SVG,
} from './utils/initialData';
import { generateMonthDays, distributeSamitiesToWorkingDays } from './utils/calendarUtils';
import { downloadReportPDF } from './utils/pdfGenerator';
import {
  formatBengaliMonthYear,
  formatBengaliDate,
  formatBengaliTime,
  toBengaliNumber,
  BENGALI_MONTHS,
} from './utils/bengaliNumerals';
import {
  loadPhotosForMonth,
  savePhotosForMonth,
  loadDaysForMonth,
  saveDaysForMonth,
  getSavedReports,
  saveMonthlyReport,
  deleteSavedReport,
} from './utils/storage';
import {
  saveCloudOfficerProfile,
  loadCloudOfficerProfile,
  saveCloudSamities,
  loadCloudSamities,
  saveCloudSchedule,
  loadCloudSchedule,
  saveCloudPhotos,
  loadCloudPhotos,
  saveCloudReport,
  loadCloudReports,
  deleteCloudReport,
  syncOfficerToRegistry,
} from './firebase/firestoreService';
import { useOfficerAuth } from './firebase/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ReportPreview } from './components/ReportPreview';
import { CalendarManager } from './components/CalendarManager';
import { PhotoManager } from './components/PhotoManager';
import { SamityManager } from './components/SamityManager';
import { OfficerSettings } from './components/OfficerSettings';
import { SignatureModal } from './components/SignatureModal';
import { SavedReportsView } from './components/SavedReportsView';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { Dashboard } from './components/Dashboard';
import { OfficerAuthModal } from './components/OfficerAuthModal';
import { AuthGate } from './components/AuthGate';
import { SamitySetupWizard, isDefaultSampleList } from './components/SamitySetupWizard';
import { AdminPanel } from './components/AdminPanel';
import {
  FileText,
  BookmarkCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  CheckCircle2,
  Download,
  Users,
  Calendar,
  Printer,
  ArrowLeft,
} from 'lucide-react';

export default function App() {
  const { currentUser, activeUser, isLoggedIn, isAdmin, syncStatus, setSyncStatus, loading } = useOfficerAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSamitySetupOpen, setIsSamitySetupOpen] = useState(false);
  const [inspectingOfficerContext, setInspectingOfficerContext] = useState<{ id: string; name: string; union: string } | null>(null);

  // Handle tab change with browser history push so mobile back button works seamlessly
  const handleTabChange = useCallback((newTab: ActiveTab) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      window.history.pushState({ tab: newTab }, '', `#${newTab}`);
    }
  }, []);

  // Listen to mobile hardware/gesture back button and browser back navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial history state
    const hashTab = window.location.hash.replace('#', '') as ActiveTab;
    const validTabs: ActiveTab[] = ['dashboard', 'preview', 'calendar', 'photos', 'samities', 'settings', 'archive', 'admin'];
    const initialTab = validTabs.includes(hashTab) ? hashTab : 'dashboard';

    if (window.history.replaceState) {
      window.history.replaceState({ tab: initialTab }, '', `#${initialTab}`);
    }
    if (initialTab !== 'dashboard') {
      setActiveTab(initialTab);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        const currentHash = window.location.hash.replace('#', '') as ActiveTab;
        if (currentHash && validTabs.includes(currentHash)) {
          setActiveTab(currentHash);
        } else {
          setActiveTab('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(() => {
    try {
      const idx = localStorage.getItem('vromon_selected_officer_index');
      if (idx) return `officer_${idx}`;
      const customEmail = localStorage.getItem('vromon_custom_email');
      if (customEmail) return `officer_${customEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      return 'officer_1';
    } catch {
      return 'officer_1';
    }
  });

  const userId = activeUser?.uid || currentUser?.uid || selectedOfficerId;

  // Officer Info
  const [officerInfo, setOfficerInfo] = useState<OfficerInfo>(() => {
    try {
      const saved = localStorage.getItem('vromon_officer_info_guest');
      return saved ? JSON.parse(saved) : DEFAULT_OFFICER_INFO;
    } catch {
      return DEFAULT_OFFICER_INFO;
    }
  });

  // Samities list
  const [samities, setSamities] = useState<Samity[]>(() => {
    try {
      const saved = localStorage.getItem('vromon_samities_guest');
      return saved ? JSON.parse(saved) : DEFAULT_SAMITIES;
    } catch {
      return DEFAULT_SAMITIES;
    }
  });

  // Signature URL
  const [signatureUrl, setSignatureUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('vromon_signature_guest');
      return saved || DEFAULT_SIGNATURE_SVG;
    } catch {
      return DEFAULT_SIGNATURE_SVG;
    }
  });

  // Month-specific Photos
  const [photos, setPhotos] = useState<FieldPhoto[]>(DEFAULT_PHOTOS);

  // Month-specific Working Days
  const [days, setDays] = useState<WorkingDay[]>(() => {
    const initialDays = generateMonthDays(officerInfo.year, officerInfo.month);
    return distributeSamitiesToWorkingDays(initialDays, DEFAULT_SAMITIES, DEFAULT_OFFICER_INFO.branchName);
  });

  // Saved Reports Archive
  const [savedReports, setSavedReports] = useState<SavedMonthlyReport[]>([]);

  // UI state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgressText, setDownloadProgressText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);

  const currentReportId = `${officerInfo.year}-${String(officerInfo.month + 1).padStart(2, '0')}`;

  // When active officer changes (login / switch), load their strictly isolated data from Firestore & Cache
  useEffect(() => {
    let isCancelled = false;

    async function syncOfficerData() {
      if (!userId) {
        // Fallback to guest storage
        const localInfo = localStorage.getItem('vromon_officer_info_guest');
        if (localInfo) setOfficerInfo(JSON.parse(localInfo));
        const localArchive = await getSavedReports();
        if (!isCancelled) setSavedReports(localArchive);
        const localPhotos = await loadPhotosForMonth(officerInfo.year, officerInfo.month);
        if (!isCancelled) setPhotos(localPhotos);
        const localDays = await loadDaysForMonth(officerInfo.year, officerInfo.month);
        if (!isCancelled && localDays) setDays(localDays);
        return;
      }

      setSyncStatus('syncing');

      try {
        // 1. Officer Profile & Settings
        const cloudProfile = await loadCloudOfficerProfile(userId);
        if (cloudProfile && cloudProfile.officerInfo) {
          if (!isCancelled) {
            setOfficerInfo((prev) => ({
              ...prev,
              ...cloudProfile.officerInfo,
            }));
            if (cloudProfile.signatureUrl) {
              setSignatureUrl(cloudProfile.signatureUrl);
            }
          }
        } else {
          // First time this officer logged in, initialize cloud profile
          const initialName = currentUser?.displayName || DEFAULT_OFFICER_INFO.officerName;
          const initialInfo: OfficerInfo = {
            ...officerInfo,
            officerName: initialName,
          };
          setOfficerInfo(initialInfo);
          await saveCloudOfficerProfile(userId, initialInfo, signatureUrl);
        }

        // 2. Officer Samities
        const cloudSamities = await loadCloudSamities(userId);
        if (cloudSamities && Array.isArray(cloudSamities) && cloudSamities.length > 0) {
          // If the cloud samities are not the old sample dummy list, use them
          if (!isDefaultSampleList(cloudSamities)) {
            if (!isCancelled) setSamities(cloudSamities);
          } else {
            // If it was previously auto-seeded with sample dummy list, clean it for this officer
            if (!isCancelled) setSamities([]);
          }
        } else {
          // Brand new officer! Do NOT seed other people's/mock samities
          // Start with clean empty list so they can enter their own societies
          if (!isCancelled) setSamities([]);
        }

        // 3. Officer Monthly Days
        const cloudDays = await loadCloudSchedule(userId, officerInfo.year, officerInfo.month);
        if (cloudDays && cloudDays.length > 0) {
          if (!isCancelled) setDays(cloudDays);
        } else {
          const freshDays = generateMonthDays(officerInfo.year, officerInfo.month);
          const distributed = distributeSamitiesToWorkingDays(freshDays, samities, officerInfo.branchName);
          if (!isCancelled) setDays(distributed);
          await saveCloudSchedule(userId, officerInfo.year, officerInfo.month, distributed);
        }

        // 4. Officer Monthly Photos
        const cloudPhotos = await loadCloudPhotos(userId, officerInfo.year, officerInfo.month);
        if (cloudPhotos && cloudPhotos.length > 0) {
          if (!isCancelled) setPhotos(cloudPhotos);
        } else {
          const cachedPhotos = await loadPhotosForMonth(officerInfo.year, officerInfo.month, userId);
          if (!isCancelled) setPhotos(cachedPhotos);
        }

        // 5. Officer Archived Reports
        const cloudReports = await loadCloudReports(userId);
        if (!isCancelled) {
          setSavedReports(cloudReports);
        }

        setSyncStatus('synced');
      } catch (err) {
        console.error('Error synchronizing officer data:', err);
        setSyncStatus('error');
      }
    }

    syncOfficerData();

    return () => {
      isCancelled = true;
    };
  }, [userId, currentUser]);

  // Save officerInfo to cloud and local cache
  const updateOfficerInfo = (newInfo: OfficerInfo) => {
    setOfficerInfo(newInfo);
    if (userId) {
      saveCloudOfficerProfile(userId, newInfo, signatureUrl);
      localStorage.setItem(`vromon_officer_info_${userId}`, JSON.stringify(newInfo));
      if (!isAdmin) {
        syncOfficerToRegistry({
          officerId: userId,
          officerName: newInfo.officerName || 'মাঠ সহকারী',
          designation: newInfo.designation || 'মাঠ সহকারী',
          email: activeUser?.email || `${userId}@psb-rangunia.gov.bd`,
          unionName: newInfo.branchName || 'রাঙ্গুনিয়া শাখা',
          branchName: newInfo.branchName || 'রাঙ্গুনিয়া শাখা',
          districtName: newInfo.districtName || 'চট্টগ্রাম',
          samitiesCount: samities.length,
          reportsCount: savedReports.length,
          hasScheduleCurrentMonth: true,
          photosCount: photos.length,
          lastActive: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      localStorage.setItem('vromon_officer_info_guest', JSON.stringify(newInfo));
    }
  };

  // Save samities to cloud and local cache
  const updateSamities = (newSamities: Samity[]) => {
    setSamities(newSamities);
    if (userId) {
      saveCloudSamities(userId, newSamities);
      localStorage.setItem(`vromon_samities_${userId}`, JSON.stringify(newSamities));
    } else {
      localStorage.setItem('vromon_samities_guest', JSON.stringify(newSamities));
    }
  };

  // Save signature
  const updateSignature = (newSig: string) => {
    setSignatureUrl(newSig);
    if (userId) {
      saveCloudOfficerProfile(userId, officerInfo, newSig);
      localStorage.setItem(`vromon_signature_${userId}`, newSig);
    } else {
      localStorage.setItem('vromon_signature_guest', newSig);
    }
  };

  // Working days only (open banking days) for Page 1 table
  const workingDaysOnly = useMemo(() => {
    return days.filter((d) => !d.isHoliday);
  }, [days]);

  // Is current month report already saved in archive?
  const isCurrentMonthSaved = useMemo(() => {
    return savedReports.some((r) => r.id === currentReportId);
  }, [savedReports, currentReportId]);

  // When photos change, auto-save to current month's store and cloud
  const handleUpdatePhotos = (newPhotos: FieldPhoto[]) => {
    setPhotos(newPhotos);
    savePhotosForMonth(officerInfo.year, officerInfo.month, newPhotos, userId);
    if (userId) {
      saveCloudPhotos(userId, officerInfo.year, officerInfo.month, newPhotos);
    }
  };

  // When days change, auto-save to current month's store and cloud
  const handleUpdateDays = (newDays: WorkingDay[]) => {
    setDays(newDays);
    saveDaysForMonth(officerInfo.year, officerInfo.month, newDays, userId);
    if (userId) {
      saveCloudSchedule(userId, officerInfo.year, officerInfo.month, newDays);
    }
  };

  // Handle Month / Year switch with month-wise photo & days switching
  const switchMonthAndYear = async (newYear: number, newMonth: number) => {
    // 1. Save current month's data before leaving
    await savePhotosForMonth(officerInfo.year, officerInfo.month, photos, userId);
    await saveDaysForMonth(officerInfo.year, officerInfo.month, days, userId);
    if (userId) {
      await saveCloudPhotos(userId, officerInfo.year, officerInfo.month, photos);
      await saveCloudSchedule(userId, officerInfo.year, officerInfo.month, days);
    }

    // 2. Update officerInfo state
    const updatedInfo = { ...officerInfo, year: newYear, month: newMonth };
    updateOfficerInfo(updatedInfo);

    // 3. Load target month's photos (with DEFAULT_PHOTOS fallback so Page 2 is always filled)
    if (userId) {
      const cloudP = await loadCloudPhotos(userId, newYear, newMonth);
      if (cloudP && cloudP.length > 0) {
        setPhotos(cloudP);
      } else {
        const monthPhotos = await loadPhotosForMonth(newYear, newMonth, userId);
        setPhotos(monthPhotos && monthPhotos.length > 0 ? monthPhotos : DEFAULT_PHOTOS);
      }
    } else {
      const monthPhotos = await loadPhotosForMonth(newYear, newMonth);
      setPhotos(monthPhotos && monthPhotos.length > 0 ? monthPhotos : DEFAULT_PHOTOS);
    }

    // 4. Load or generate target month's days
    let targetDays: WorkingDay[] | null = null;
    if (userId) {
      targetDays = await loadCloudSchedule(userId, newYear, newMonth);
    }
    if (!targetDays) {
      targetDays = await loadDaysForMonth(newYear, newMonth, userId);
    }

    if (targetDays && targetDays.length > 0) {
      setDays(targetDays);
    } else {
      const freshDays = generateMonthDays(newYear, newMonth);
      const distributed = distributeSamitiesToWorkingDays(freshDays, samities, officerInfo.branchName);
      setDays(distributed);
      await saveDaysForMonth(newYear, newMonth, distributed, userId);
      if (userId) {
        await saveCloudSchedule(userId, newYear, newMonth, distributed);
      }
    }
  };

  const handleMonthChange = (newMonth: number) => {
    switchMonthAndYear(officerInfo.year, newMonth);
  };

  const handleYearChange = (newYear: number) => {
    switchMonthAndYear(newYear, officerInfo.month);
  };

  // Redistribute Samities across active working days
  const handleRedistribute = useCallback(() => {
    const distributed = distributeSamitiesToWorkingDays(days, samities, officerInfo.branchName);
    setDays(distributed);
    saveDaysForMonth(officerInfo.year, officerInfo.month, distributed, userId);
    if (userId) {
      saveCloudSchedule(userId, officerInfo.year, officerInfo.month, distributed);
    }
    setStatusMessage({
      type: 'success',
      text: 'খোলা দিনগুলোতে সমিতি সফলভাবে বণ্টন করা হয়েছে!',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  }, [days, samities, officerInfo.branchName, officerInfo.year, officerInfo.month, userId]);

  // Save Report Action: saves entire monthly report & photos to archive and cloud
  const handleSaveReport = async () => {
    try {
      const now = new Date();
      const monthLabel = formatBengaliMonthYear(officerInfo.month, officerInfo.year);
      const report: SavedMonthlyReport = {
        id: currentReportId,
        year: officerInfo.year,
        month: officerInfo.month,
        monthYearLabel: monthLabel,
        savedAt: now.toISOString(),
        savedAtFormatted: `${formatBengaliDate(now)}, ${formatBengaliTime(now)}`,
        officerInfo: { ...officerInfo },
        workingDays: [...workingDaysOnly],
        photos: [...photos],
        signatureUrl,
        totalVisits: workingDaysOnly.length,
        totalPhotos: photos.length,
      };

      const updatedArchive = await saveMonthlyReport(report, userId);
      setSavedReports(updatedArchive);

      if (userId) {
        await saveCloudReport(userId, report);
        if (!isAdmin) {
          syncOfficerToRegistry({
            officerId: userId,
            officerName: officerInfo.officerName || 'মাঠ সহকারী',
            designation: officerInfo.designation || 'মাঠ সহকারী',
            email: activeUser?.email || `${userId}@psb-rangunia.gov.bd`,
            unionName: officerInfo.branchName || 'রাঙ্গুনিয়া শাখা',
            branchName: officerInfo.branchName || 'রাঙ্গুনিয়া শাখা, চট্টগ্রাম।',
            samitiesCount: samities.length,
            reportsCount: updatedArchive.length,
            hasScheduleCurrentMonth: workingDaysOnly.length > 0,
            photosCount: photos.length,
            lastActive: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setStatusMessage({
        type: 'success',
        text: `${monthLabel} মাসের ভ্রমণ বিবরণী ও ছবি সফলভাবে ক্লাউডে সংরক্ষিত হয়েছে!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error(e);
      setStatusMessage({
        type: 'error',
        text: 'রিপোর্ট সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
      });
    }
  };

  // Load an archived report
  const handleLoadArchivedReport = async (report: SavedMonthlyReport) => {
    // Save current month before switching
    await savePhotosForMonth(officerInfo.year, officerInfo.month, photos, userId);
    await saveDaysForMonth(officerInfo.year, officerInfo.month, days, userId);

    setOfficerInfo(report.officerInfo);
    setPhotos(report.photos);
    setSignatureUrl(report.signatureUrl);

    // Reconstruct full days for the calendar or set working days
    const fullDays = generateMonthDays(report.year, report.month);
    const dayMap = new Map<string, WorkingDay>();
    report.workingDays.forEach((wd) => dayMap.set(wd.date, wd));

    const restoredDays = fullDays.map((d) => {
      const matched = dayMap.get(d.date);
      if (matched) return matched;
      return d;
    });

    setDays(restoredDays);
    setActiveTab('preview');

    setStatusMessage({
      type: 'success',
      text: `${report.monthYearLabel} মাসের সংরক্ষিত রিপোর্টটি সক্রিয় প্রিভিউতে লোড হয়েছে!`,
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Download PDF from an archived report directly
  const handleDownloadArchivedReport = async (report: SavedMonthlyReport) => {
    await handleLoadArchivedReport(report);
    await new Promise((r) => setTimeout(r, 300));
    await handleDownloadPDF();
  };

  // Delete an archived report
  const handleDeleteArchivedReport = async (reportId: string) => {
    // Optimistically update state immediately so it disappears from UI right away
    setSavedReports((prev) => prev.filter((r) => r.id !== reportId));

    try {
      // 1. Delete from current scoped storage
      await deleteSavedReport(reportId, userId);
      // 2. Also delete from guest and fallback keys in case report was saved there
      await deleteSavedReport(reportId);
      await deleteSavedReport(reportId, 'officer_1');
      if (selectedOfficerId && selectedOfficerId !== userId) {
        await deleteSavedReport(reportId, selectedOfficerId);
      }
      // 3. Delete from Firestore cloud
      if (userId) {
        await deleteCloudReport(userId, reportId);
      }

      setStatusMessage({
        type: 'success',
        text: 'সংরক্ষিত রিপোর্ট সফলভাবে মুছে ফেলা হয়েছে!',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.warn('Error deleting report:', err);
    }
  };

  // PDF Download Action
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgressText('পিডিএফ প্রস্তুত হচ্ছে...');

      if (activeTab !== 'preview') {
        setActiveTab('preview');
        await new Promise((r) => setTimeout(r, 400));
      }

      const fileName = `ভ্রমণ_বিবরণী_${formatBengaliMonthYear(officerInfo.month, officerInfo.year).replace('/', '_')}.pdf`;

      await downloadReportPDF('pdf-page-1', 'pdf-page-2', fileName, (prog) => {
        setDownloadProgressText(prog);
      });

      // Auto save to archive and cloud on download
      handleSaveReport();

      setStatusMessage({
        type: 'success',
        text: '২ পৃষ্ঠার পিডিএফ সফলভাবে ডাউনলোড ও সেভ হয়েছে!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'পিডিএফ তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgressText('');
    }
  };

  // Admin inspects an officer: load that officer's data across all menus (report, samities, calendar, photos, archive, info)
  const handleAdminInspectOfficer = async (officerId: string, officerName: string, union: string) => {
    try {
      setStatusMessage({ type: 'success', text: `"${officerName}"-এর সকল তথ্য লোড করা হচ্ছে...` });
      const [cloudProfile, cloudSamities, cloudDays, cloudPhotos, cloudReports] = await Promise.all([
        loadCloudOfficerProfile(officerId),
        loadCloudSamities(officerId),
        loadCloudSchedule(officerId, officerInfo.year, officerInfo.month),
        loadCloudPhotos(officerId, officerInfo.year, officerInfo.month),
        loadCloudReports(officerId),
      ]);

      const formattedUnion = union ? (union.includes('শাখা') ? union : `${union}, রাঙ্গুনিয়া শাখা`) : officerInfo.branchName;

      setOfficerInfo((prev) => ({
        ...prev,
        officerName,
        branchName: cloudProfile?.officerInfo?.branchName || formattedUnion,
        districtName: cloudProfile?.officerInfo?.districtName || prev.districtName || 'চট্টগ্রাম',
        ...(cloudProfile?.officerInfo || {}),
      }));

      // 1. Samities for this officer
      setSamities(cloudSamities || []);

      // 2. Days and Schedule
      if (cloudDays && cloudDays.length > 0) {
        setDays(cloudDays);
      } else {
        const freshDays = generateMonthDays(officerInfo.year, officerInfo.month);
        const distributed = distributeSamitiesToWorkingDays(freshDays, cloudSamities || [], formattedUnion);
        setDays(distributed);
      }

      // 3. Field Photos
      if (cloudPhotos && cloudPhotos.length > 0) {
        setPhotos(cloudPhotos);
      } else {
        setPhotos(DEFAULT_PHOTOS);
      }

      // 4. Signature
      if (cloudProfile?.signatureUrl) {
        setSignatureUrl(cloudProfile.signatureUrl);
      }

      // 5. Archived Reports
      if (cloudReports) {
        setSavedReports(cloudReports);
      }

      // Set active officer context across all menus
      setSelectedOfficerId(officerId);
      setInspectingOfficerContext({
        id: officerId,
        name: officerName,
        union: union,
      });

      // Switch to HTML View / Preview Report
      handleTabChange('preview');
      setStatusMessage({ type: 'success', text: `"${officerName}"-এর সকল মেনু ও রিপোর্ট সফলভাবে প্রদর্শিত হয়েছে!` });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'কর্মকর্তার তথ্য লোড করতে সমস্যা হয়েছে।' });
    }
  };

  // Admin downloads an officer's report PDF directly
  const handleAdminDownloadOfficerReport = async (officerId: string, officerName: string, union: string) => {
    await handleAdminInspectOfficer(officerId, officerName, union);
    await new Promise((r) => setTimeout(r, 400));
    await handleDownloadPDF();
  };

  // Browser Print Action
  const handlePrint = () => {
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      setTimeout(() => {
        window.print();
      }, 300);
    } else {
      window.print();
    }
  };

  // 1. Loading splash screen while session initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f2] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-700 text-white flex items-center justify-center p-2 shadow-md animate-pulse">
          <img src="/icon.svg" alt="PSB" className="w-full h-full object-contain" />
        </div>
        <p className="mt-3 text-xs font-bold text-amber-900">লোড হচ্ছে...</p>
      </div>
    );
  }

  // 2. REGISTRATION & LOGIN GATE
  // As requested: anyone wishing to use the app must register first, then enter using their ID
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#faf8f2] flex flex-col font-sans">
        <AuthGate
          onLoginSuccess={(officer) => {
            const updated = {
              ...officerInfo,
              officerName: officer.name || officerInfo.officerName,
              designation: officer.designation || officerInfo.designation,
              branchName: officer.union
                ? `${officer.union}, রাঙ্গুনিয়া শাখা, চট্টগ্রাম।`
                : officerInfo.branchName,
            };
            updateOfficerInfo(updated);
            // Admin does NOT need to add societies ("এডমিন এর জন্য সমিতি যুক্ত রার প্রয়োজন নাই।")
            const isUserAdmin = isAdmin || officer.designation === 'এডমিন' || officer.name === 'শাখা কর্মকর্তা';
            if (!isUserAdmin) {
              // For newly registered or logging-in officer without their own setup:
              // Ensure samities are empty so they do not see another person's mock societies
              const officerStorageKey = `vromon_samity_setup_done_${officer.name}`;
              const alreadySetup = localStorage.getItem(officerStorageKey);
              if (!alreadySetup || isDefaultSampleList(samities)) {
                setSamities([]);
              }

              // Open Samity Entry setup wizard immediately for officers
              setIsSamitySetupOpen(true);
              setStatusMessage({
                type: 'success',
                text: `স্বাগতম "${officer.name}"! আপনার অধীনে থাকা সমিতিগুলো একে একে যুক্ত করুন।`,
              });
              setTimeout(() => setStatusMessage(null), 4000);
            } else {
              setIsSamitySetupOpen(false);
              handleTabChange('admin');
              setStatusMessage({
                type: 'success',
                text: 'এডমিন হিসেবে সফলভাবে প্রবেশ করেছেন!',
              });
              setTimeout(() => setStatusMessage(null), 3000);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f2] flex flex-col font-sans pb-20 xl:pb-8">
      {/* PWA Mobile Install Floating Bar */}
      <PWAInstallBanner />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onDownloadPDF={handleDownloadPDF}
        onPrint={handlePrint}
        onSaveReport={handleSaveReport}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isDownloading={isDownloading}
        downloadProgressText={downloadProgressText}
        savedReportsCount={savedReports.length}
        currentOfficerName={officerInfo.officerName}
        currentDesignation={officerInfo.designation}
      />

      {/* Flash Status Message Toast */}
      {statusMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4 no-print">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold border ${
              statusMessage.type === 'success'
                ? 'bg-amber-950 text-amber-100 border-amber-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Admin Inspecting Specific Officer Context Banner */}
      {isAdmin && inspectingOfficerContext && (
        <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-white px-4 py-2.5 border-b border-amber-600 shadow-md sticky top-15 z-30 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-1 no-print">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-200 animate-pulse shrink-0" />
            <div className="text-xs sm:text-sm font-bold truncate">
              <span>এডমিন মোড: বর্তমানে কর্মকর্তা </span>
              <span className="text-amber-200 underline font-black">"{inspectingOfficerContext.name}"</span>
              <span className="text-stone-300 font-normal"> ({inspectingOfficerContext.union})-এর সকল তথ্য (রিপোর্ট, সমিতি, ছবি, ক্যালেন্ডার) দেখছেন</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-amber-400 text-stone-950 font-black'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              রিপোর্ট দেখুন
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className="px-3 py-1 bg-white hover:bg-amber-100 text-stone-900 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              এডমিন প্যানেলে ফিরুন ↵
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        {/* Compact In-Menu Back Button (প্রতিটি মেনুতে খুবই ছোট ব্যাক বাটন) */}
        {activeTab !== 'dashboard' && (
          <div className="no-print mb-3 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 text-xs font-bold border border-amber-300/80 shadow-2xs transition active:scale-95 cursor-pointer"
              title="ড্যাশবোর্ডে ফিরে যান"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>← ফিরে যান (ড্যাশবোর্ড)</span>
            </button>

            <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
              মোবাইলের ব্যাক বাটন চেপেও ফিরে যেতে পারবেন
            </span>
          </div>
        )}

        {/* TAB 0: DASHBOARD (OVERVIEW & ALL MENUS HUB) */}
        {activeTab === 'dashboard' && (
          <Dashboard
            officerInfo={officerInfo}
            samities={samities}
            photos={photos}
            days={days}
            savedReports={savedReports}
            signatureUrl={signatureUrl}
            onTabChange={handleTabChange}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
            onDownloadPDF={handleDownloadPDF}
            onPrint={() => window.print()}
            onSaveReport={handleSaveReport}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            isDownloading={isDownloading}
          />
        )}

        {/* TAB 1: REPORT PREVIEW (The 2-Page Document) */}
        {activeTab === 'preview' && (
          isAdmin && !inspectingOfficerContext ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-xl mx-auto my-12 text-center border border-amber-200/80 shadow-xs space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center border border-amber-200 shadow-2xs">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                কোনো কর্মকর্তার রিপোর্ট নির্বাচিত নেই
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                এডমিন প্যানেলে কোনো কর্মকর্তা না থাকলে অথবা এখনো কোনো কর্মকর্তা নির্বাচন করা না হলে রিপোর্ট ফাঁকা থাকবে। কোনো কর্মকর্তার ভ্রমণ বিবরণী ও রিপোর্ট দেখার জন্য এডমিন প্যানেল থেকে উক্ত কর্মকর্তার নামের উপর ক্লিক করুন।
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('admin')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>এডমিন প্যানেলে কর্মকর্তা তালিকা দেখুন</span>
                </button>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {/* Action & Stats Banner for HTML View */}
            <div className="no-print bg-white rounded-2xl p-4 shadow-xs border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-700 text-white">
                      HTML View
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-stone-900">
                      {formatBengaliMonthYear(officerInfo.month, officerInfo.year)} ভ্রমণ বিবরণী
                    </h2>

                    {/* Month & Year Selectors in HTML View */}
                    <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      <select
                        value={officerInfo.month}
                        onChange={(e) => handleMonthChange(Number(e.target.value))}
                        className="bg-transparent text-amber-950 font-bold focus:outline-hidden cursor-pointer"
                        title="মাস নির্বাচন করুন"
                      >
                        {BENGALI_MONTHS.map((m, idx) => (
                          <option key={idx} value={idx} className="bg-white text-stone-800 font-medium">
                            {m}
                          </option>
                        ))}
                      </select>
                      <span className="text-amber-400 font-bold">/</span>
                      <select
                        value={officerInfo.year}
                        onChange={(e) => handleYearChange(Number(e.target.value))}
                        className="bg-transparent text-amber-950 font-bold focus:outline-hidden cursor-pointer"
                        title="বছর নির্বাচন করুন"
                      >
                        {[2024, 2025, 2026, 2027, 2028].map((y) => (
                          <option key={y} value={y} className="bg-white text-stone-800 font-medium">
                            {toBengaliNumber(y)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isCurrentMonthSaved && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <BookmarkCheck className="w-3 h-3 text-amber-700" />
                        সংরক্ষিত
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    পৃষ্ঠা ১: ভ্রমণের তারিখ ও সমিতি ({toBengaliNumber(workingDaysOnly.length)} টি) • পৃষ্ঠা ২: স্থিরচিত্র ({toBengaliNumber(photos.length)} টি)
                  </p>
                </div>
              </div>

              {/* Controls: Print, Save, PDF Download, Zoom */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* Print Button (User Requested) */}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="এইচটিএমএল রিপোর্ট সরাসরি প্রিন্ট করুন"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট করুন</span>
                </button>

                {/* Save Button (User Requested) */}
                <button
                  onClick={handleSaveReport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="এই মাসের রিপোর্ট ও ছবি আর্কাইভে সংরক্ষণ করুন"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>সেভ করুন</span>
                </button>

                {/* PDF Download */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer border border-amber-500"
                  title="পিডিএফ ফাইল ডাউনলোড করুন"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>পিডিএফ</span>
                </button>

                {/* Zoom buttons */}
                <div className="flex items-center bg-stone-100 rounded-xl p-1 text-stone-600 border border-stone-200/60">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                    className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
                    title="জুম আউট"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-semibold">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
                    className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
                    title="জুম ইন"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(0.85)}
                    className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
                    title="রিসেট জুম"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Render Container with Responsive Scale */}
            <div className="overflow-x-auto py-2 flex justify-center">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="w-full flex justify-center"
              >
                <ReportPreview
                  officerInfo={officerInfo}
                  workingDays={workingDaysOnly}
                  photos={photos}
                  signatureUrl={signatureUrl}
                />
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB 2: CALENDAR & HOLIDAYS */}
        {activeTab === 'calendar' && (
          <CalendarManager
            days={days}
            year={officerInfo.year}
            month={officerInfo.month}
            onUpdateDays={handleUpdateDays}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            onRedistribute={handleRedistribute}
            samities={samities}
          />
        )}

        {/* TAB 3: PHOTO UPLOAD (Month-wise) */}
        {activeTab === 'photos' && (
          <PhotoManager
            photos={photos}
            onUpdatePhotos={handleUpdatePhotos}
            month={officerInfo.month}
            year={officerInfo.year}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
          />
        )}

        {/* TAB 4: SAMITY & UNION MANAGER */}
        {activeTab === 'samities' && (
          <SamityManager
            samities={samities}
            onUpdateSamities={(newSamities) => {
              updateSamities(newSamities);
              const distributed = distributeSamitiesToWorkingDays(days, newSamities, officerInfo.branchName);
              handleUpdateDays(distributed);
            }}
            onRedistribute={handleRedistribute}
            onOpenSetupWizard={() => setIsSamitySetupOpen(true)}
          />
        )}

        {/* TAB 5: OFFICER SETTINGS */}
        {activeTab === 'settings' && (
          <OfficerSettings
            officerInfo={officerInfo}
            onUpdateOfficerInfo={(info) => {
              updateOfficerInfo(info);
              setDays((prev) =>
                prev.map((d) => ({ ...d, branchName: info.branchName }))
              );
            }}
            signatureUrl={signatureUrl}
            onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* TAB 6: SAVED REPORTS ARCHIVE */}
        {activeTab === 'archive' && (
          <SavedReportsView
            savedReports={savedReports}
            onLoadReport={handleLoadArchivedReport}
            onDownloadReportPDF={handleDownloadArchivedReport}
            onDeleteReport={handleDeleteArchivedReport}
            currentActiveMonthYear={currentReportId}
          />
        )}

        {/* TAB 7: SUPERVISOR & BRANCH ADMIN PANEL */}
        {activeTab === 'admin' && (
          <AdminPanel
            currentYear={officerInfo.year}
            currentMonth={officerInfo.month}
            onInspectOfficer={handleAdminInspectOfficer}
            onDownloadOfficerReport={handleAdminDownloadOfficerReport}
            onExitAdmin={() => handleTabChange('dashboard')}
          />
        )}
      </main>

      {/* Signature Editor Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        currentSignature={signatureUrl}
        onSave={(newSig) => {
          updateSignature(newSig);
          setStatusMessage({
            type: 'success',
            text: 'স্বাক্ষর সফলভাবে সংরক্ষিত হয়েছে!',
          });
          setTimeout(() => setStatusMessage(null), 3000);
        }}
      />

      {/* Officer Switcher & Auth Modal */}
      <OfficerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentOfficerName={officerInfo.officerName}
        onSelectAdmin={() => {
          handleTabChange('admin');
          setStatusMessage({
            type: 'success',
            text: 'এডমিন প্যানেলে সফলভাবে প্রবেশ করা হয়েছে!',
          });
          setTimeout(() => setStatusMessage(null), 3500);
        }}
        onSelectOfficerProfile={(name, union, designation) => {
          const updated = {
            ...officerInfo,
            officerName: name,
            designation: designation || officerInfo.designation,
          };
          updateOfficerInfo(updated);
          const idx = localStorage.getItem('vromon_selected_officer_index') || '1';
          setSelectedOfficerId(`officer_${idx}`);
          setStatusMessage({
            type: 'success',
            text: `"${name}" হিসেবে সফলভাবে প্রবেশ করা হয়েছে!`,
          });
          setTimeout(() => setStatusMessage(null), 3500);
        }}
      />

      {/* Streamlined Samity Entry Setup Wizard (After Login) */}
      <SamitySetupWizard
        isOpen={isSamitySetupOpen && !isAdmin}
        defaultUnion={localStorage.getItem('vromon_selected_default_union') || '১৩নং ইসলামপুর'}
        officerName={officerInfo.officerName}
        existingSamities={isDefaultSampleList(samities) ? [] : samities}
        onComplete={(newSamities) => {
          updateSamities(newSamities);
          localStorage.setItem(`vromon_samity_setup_done_${userId}`, 'true');
          localStorage.setItem(`vromon_samity_setup_done_${officerInfo.officerName}`, 'true');
          setIsSamitySetupOpen(false);

          // Automatically distribute new samities across active working days of current month
          const freshDays = generateMonthDays(officerInfo.year, officerInfo.month);
          const distributed = distributeSamitiesToWorkingDays(freshDays, newSamities, officerInfo.branchName);
          handleUpdateDays(distributed);

          // Direct them straight to the report preview ("তার পর থেকে রিপোট নেওয়ার কাজ করতে পারবে")
          handleTabChange('preview');

          setStatusMessage({
            type: 'success',
            text: `${toBengaliNumber(newSamities.length)}টি সমিতি সফলভাবে যুক্ত ও ভ্রমণ বিবরণীতে বণ্টন হয়েছে! এখন সরাসরি রিপোর্ট দেখুন ও প্রিন্ট করুন।`,
          });
          setTimeout(() => setStatusMessage(null), 4500);
        }}
      />

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        savedReportsCount={savedReports.length}
      />
    </div>
  );
}

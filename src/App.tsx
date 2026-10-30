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
import { OfficerAuthModal } from './components/OfficerAuthModal';
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
} from 'lucide-react';

export default function App() {
  const { currentUser, syncStatus, setSyncStatus } = useOfficerAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const userId = currentUser?.uid;

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
        if (cloudSamities && cloudSamities.length > 0) {
          if (!isCancelled) setSamities(cloudSamities);
        } else {
          // Initialize user's default samities
          await saveCloudSamities(userId, DEFAULT_SAMITIES);
          if (!isCancelled) setSamities(DEFAULT_SAMITIES);
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

    // 3. Load target month's photos
    if (userId) {
      const cloudP = await loadCloudPhotos(userId, newYear, newMonth);
      if (cloudP && cloudP.length > 0) {
        setPhotos(cloudP);
      } else {
        const monthPhotos = await loadPhotosForMonth(newYear, newMonth, userId);
        setPhotos(monthPhotos);
      }
    } else {
      const monthPhotos = await loadPhotosForMonth(newYear, newMonth);
      setPhotos(monthPhotos);
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
    const updated = await deleteSavedReport(reportId, userId);
    setSavedReports(updated);
    if (userId) {
      await deleteCloudReport(userId, reportId);
    }
    setStatusMessage({
      type: 'success',
      text: 'সংরক্ষিত রিপোর্ট মুছে ফেলা হয়েছে।',
    });
    setTimeout(() => setStatusMessage(null), 3000);
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

  return (
    <div className="min-h-screen bg-[#faf8f2] flex flex-col font-sans pb-20 xl:pb-8">
      {/* PWA Mobile Install Floating Bar */}
      <PWAInstallBanner />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDownloadPDF={handleDownloadPDF}
        onPrint={handlePrint}
        onSaveReport={handleSaveReport}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isDownloading={isDownloading}
        downloadProgressText={downloadProgressText}
        savedReportsCount={savedReports.length}
        currentOfficerName={officerInfo.officerName}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        {/* TAB 1: REPORT PREVIEW (The 2-Page Document) */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            {/* Action & Stats Banner for Preview */}
            <div className="no-print bg-white rounded-2xl p-4 shadow-xs border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-stone-800">
                      {formatBengaliMonthYear(officerInfo.month, officerInfo.year)} মাসের ভ্রমণ বিবরণী
                    </h2>
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

              {/* Controls: Zoom & Save & Download */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* Switch Officer / Account button */}
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100/60 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition active:scale-95"
                  title="অফিসার পরিবর্তন করুন"
                >
                  <Users className="w-3.5 h-3.5 text-amber-700" />
                  <span>অফিসার অ্যাকাউন্ট</span>
                </button>

                {/* Save Report */}
                <button
                  onClick={handleSaveReport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition active:scale-95"
                  title="এই মাসের রিপোর্ট ও ছবি আর্কাইভে সংরক্ষণ করুন"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>সেভ করুন</span>
                </button>

                {/* Zoom buttons */}
                <div className="flex items-center bg-stone-100 rounded-xl p-1 text-stone-600 border border-stone-200/60">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                    className="p-1.5 hover:bg-white rounded-lg transition"
                    title="জুম আউট"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-semibold">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
                    className="p-1.5 hover:bg-white rounded-lg transition"
                    title="জুম ইন"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(0.85)}
                    className="p-1.5 hover:bg-white rounded-lg transition"
                    title="রিসেট জুম"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer border border-amber-500"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>পিডিএফ ডাউনলোড</span>
                </button>
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
        onSelectOfficerProfile={(name, union, designation) => {
          const updated = {
            ...officerInfo,
            officerName: name,
            designation: designation || officerInfo.designation,
          };
          updateOfficerInfo(updated);
        }}
      />

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedReportsCount={savedReports.length}
      />
    </div>
  );
}

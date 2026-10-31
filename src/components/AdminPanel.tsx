import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Search,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Eye,
  Building,
  RefreshCw,
  LogOut,
  ChevronRight,
  Filter,
  UserCheck,
  Printer,
  Sparkles,
  MapPin,
  Clock,
  Download,
  Trash2,
} from 'lucide-react';
import { OfficerInfo, Samity, WorkingDay, FieldPhoto, SavedMonthlyReport, OfficerSummary } from '../types';
import { useOfficerAuth } from '../firebase/AuthContext';
import {
  toBengaliNumber,
  formatBengaliMonthYear,
} from '../utils/bengaliNumerals';
import {
  fetchAllOfficersForAdmin,
  loadCloudSchedule,
  loadCloudPhotos,
  loadCloudSamities,
  loadCloudOfficerProfile,
  loadCloudReports,
  deleteOfficerFromFirestore,
} from '../firebase/firestoreService';

interface AdminPanelProps {
  currentYear: number;
  currentMonth: number;
  onInspectOfficer: (officerId: string, officerName: string, union: string) => void;
  onDownloadOfficerReport: (officerId: string, officerName: string, union: string) => Promise<void>;
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentYear,
  currentMonth,
  onInspectOfficer,
  onDownloadOfficerReport,
  onExitAdmin,
}) => {
  const { toggleAdminRole, signOut, currentUser } = useOfficerAuth();
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnionFilter, setSelectedUnionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'pending'>('all');
  const [inspectingOfficer, setInspectingOfficer] = useState<OfficerSummary | null>(null);
  const [inspectData, setInspectData] = useState<{
    profile?: Partial<OfficerInfo>;
    samities?: Samity[];
    days?: WorkingDay[];
    photos?: FieldPhoto[];
    reports?: SavedMonthlyReport[];
  } | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [officerToDelete, setOfficerToDelete] = useState<OfficerSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load only genuine officers from Firestore (default dummy users removed per request)
  const loadOfficersData = async () => {
    setIsLoading(true);
    try {
      const cloudOfficers = await fetchAllOfficersForAdmin();
      setOfficers(cloudOfficers || []);
    } catch (err) {
      console.error('Error loading officers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfficersData();
  }, [currentYear, currentMonth]);

  // Handle User Deletion
  const handleConfirmDelete = async () => {
    if (!officerToDelete) return;
    setIsDeleting(true);
    try {
      const ok = await deleteOfficerFromFirestore(officerToDelete.officerId);
      if (ok) {
        setOfficers((prev) => prev.filter((o) => o.officerId !== officerToDelete.officerId));
        setActionStatus({
          type: 'success',
          text: `"${officerToDelete.officerName}"-এর অ্যাকাউন্ট ও সকল তথ্য ডেটাবেস থেকে সফলভাবে মুছে ফেলা হয়েছে!`,
        });
        setTimeout(() => setActionStatus(null), 4000);
        setOfficerToDelete(null);
      } else {
        setActionStatus({
          type: 'error',
          text: 'ব্যবহারকারী মুছতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        });
        setTimeout(() => setActionStatus(null), 4000);
      }
    } catch (err) {
      console.error('Delete officer error:', err);
      setActionStatus({
        type: 'error',
        text: 'ব্যবহারকারী মুছতে সমস্যা হয়েছে।',
      });
      setTimeout(() => setActionStatus(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Inspect Modal
  const handleOpenInspect = async (officer: OfficerSummary) => {
    setInspectingOfficer(officer);
    setIsDataLoading(true);
    try {
      const [profile, samities, days, photos, reports] = await Promise.all([
        loadCloudOfficerProfile(officer.officerId),
        loadCloudSamities(officer.officerId),
        loadCloudSchedule(officer.officerId, currentYear, currentMonth),
        loadCloudPhotos(officer.officerId, currentYear, currentMonth),
        loadCloudReports(officer.officerId),
      ]);

      setInspectData({
        profile: profile?.officerInfo,
        samities: samities || [],
        days: days || [],
        photos: photos || [],
        reports: reports || [],
      });
    } catch (err) {
      console.error('Error inspecting officer:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleDownload = async (officer: OfficerSummary) => {
    setDownloadingId(officer.officerId);
    try {
      await onDownloadOfficerReport(officer.officerId, officer.officerName, officer.unionName);
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter list
  const filteredOfficers = useMemo(() => {
    return officers.filter((off) => {
      const matchesSearch =
        off.officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        off.unionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        off.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (off.index && toBengaliNumber(off.index).includes(searchQuery));

      const matchesUnion =
        selectedUnionFilter === 'all' || off.unionName === selectedUnionFilter;

      const isReady = (off.reportsCount > 0) || off.hasScheduleCurrentMonth;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'ready' && isReady) ||
        (statusFilter === 'pending' && !isReady);

      return matchesSearch && matchesUnion && matchesStatus;
    });
  }, [officers, searchQuery, selectedUnionFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = officers.length;
    const ready = officers.filter((o) => (o.reportsCount > 0) || o.hasScheduleCurrentMonth).length;
    const totalSamities = officers.reduce((acc, curr) => acc + (curr.samitiesCount || 0), 0);
    const totalReports = officers.reduce((acc, curr) => acc + (curr.reportsCount || 0), 0);

    return {
      total,
      ready,
      pending: total - ready,
      totalSamities,
      totalReports,
    };
  }, [officers]);

  const uniqueUnions = useMemo(() => {
    const set = new Set<string>();
    officers.forEach((o) => {
      if (o.unionName) set.add(o.unionName);
    });
    return Array.from(set);
  }, [officers]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Banner: Admin Authorization Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-amber-500/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-stone-950 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                সুপারভাইজার ও এডমিন প্যানেল
              </span>
              <span className="text-xs text-amber-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                {currentUser?.email || 'admin@psb-rangunia.gov.bd'}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <span>রাঙ্গুনিয়া উপজেলা মাঠ সহকারী পর্যবেক্ষণ কেন্দ্র</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-300">
              সকল ২৫ জন মাঠ সহকারীর পৃথক সমিতি, ভ্রমণ দিনপঞ্জি ও মাসিক প্রতিবেদনের সম্মিলিত তদারকি ও ডেটাবেস
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadOfficersData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              রিফ্রেশ
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              তালিকা প্রিন্ট
            </button>

            <button
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              এডমিন ত্যাগ করুন
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-amber-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-900 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-stone-500">মোট মাঠ সহকারী</div>
            <div className="text-xl font-black text-stone-900">{toBengaliNumber(stats.total)} জন</div>
            <div className="text-[10px] text-amber-700">সকল ২৫টি ইউনিয়ন</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-stone-500">সূচি প্রস্তুতকারী</div>
            <div className="text-xl font-black text-emerald-800">{toBengaliNumber(stats.ready)} জন</div>
            <div className="text-[10px] text-emerald-600">{toBengaliNumber(Math.round((stats.ready / (stats.total || 1)) * 100))}% সম্পন্ন</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-stone-500">মোট তদারকীকৃত সমিতি</div>
            <div className="text-xl font-black text-stone-900">{toBengaliNumber(stats.totalSamities)} টি</div>
            <div className="text-[10px] text-stone-500">পল্লী সঞ্চয় ব্যাংক</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
            <FileDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-stone-500">সংরক্ষিত রিপোর্ট</div>
            <div className="text-xl font-black text-stone-900">{toBengaliNumber(stats.totalReports)} টি</div>
            <div className="text-[10px] text-blue-700">ডিজিটাল আর্কাইভ</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="মাঠ সহকারীর নাম, ইউনিয়ন বা ইমেইল দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#faf8f2] border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Union Selector */}
          <select
            value={selectedUnionFilter}
            onChange={(e) => setSelectedUnionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#faf8f2] border border-amber-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">সকল ইউনিয়ন ({toBengaliNumber(uniqueUnions.length)})</option>
            {uniqueUnions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <div className="inline-flex rounded-xl p-1 bg-[#faf8f2] border border-amber-200 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'all' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              সকল
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'ready' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              প্রস্তুত
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'pending' ? 'bg-stone-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              চলমান
            </button>
          </div>
        </div>
      </div>

      {/* Action Status Notification Toast */}
      {actionStatus && (
        <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2 shadow-md bg-stone-900 text-white border-amber-400">
          <div className="flex items-center gap-2">
            {actionStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionStatus.text}</span>
          </div>
          <button
            onClick={() => setActionStatus(null)}
            className="text-stone-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Officers List / Table */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-amber-100/40 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-800" />
            <h2 className="text-sm font-bold text-stone-900">
              মাঠ সহকারীদের তালিকা ও চলতি মাসের কার্যক্রম ({formatBengaliMonthYear(currentMonth, currentYear)})
            </h2>
          </div>
          <span className="text-xs text-stone-500">
            প্রদর্শিত: {toBengaliNumber(filteredOfficers.length)} জন
          </span>
        </div>

        <div className="divide-y divide-amber-100 max-h-[65vh] overflow-y-auto">
          {filteredOfficers.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">
              কোনো মাঠ সহকারীর তথ্য পাওয়া যায়নি।
            </div>
          ) : (
            filteredOfficers.map((officer) => (
              <div
                key={officer.officerId}
                onClick={() => onInspectOfficer(officer.officerId, officer.officerName, officer.unionName)}
                className="p-3 sm:p-4 hover:bg-amber-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                {/* Officer Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 border border-amber-300 group-hover:bg-amber-600 group-hover:text-white transition">
                    {officer.index ? `#${toBengaliNumber(officer.index)}` : 'মাঠ'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-950 transition truncate">
                        {officer.officerName}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-medium">
                        {officer.designation}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-600 mt-0.5">
                      <span className="text-amber-900 font-semibold">{officer.unionName}</span>
                      <span>•</span>
                      <span className="text-stone-500 font-mono text-[11px]">{officer.email}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mt-1">
                      <span>সমিতি: <strong className="text-stone-800">{toBengaliNumber(officer.samitiesCount || 0)}টি</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        সূচি প্রস্তুত
                      </span>
                      <span>•</span>
                      <span>রিপোর্ট: <strong className="text-stone-800">{toBengaliNumber(officer.reportsCount || 0)}টি</strong></span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onInspectOfficer(officer.officerId, officer.officerName, officer.unionName)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                    title="এই কর্মকর্তার সকল তথ্য ও মেনু ওপেন করুন"
                  >
                    <span>সকল তথ্য ও রিপোর্ট</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenInspect(officer)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                    title="সংক্ষিপ্ত তথ্য ও রিপোর্ট তালিকা দেখুন"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>সারাংশ</span>
                  </button>

                  <button
                    onClick={() => handleDownload(officer)}
                    disabled={downloadingId === officer.officerId}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                    title="পিডিএফ ডাউনলোড করুন"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{downloadingId === officer.officerId ? '...' : 'পিডিএফ'}</span>
                  </button>

                  <button
                    onClick={() => setOfficerToDelete(officer)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                    title="ব্যবহারকারী মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>মুছুন</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Officer Inspection Modal / Drawer */}
      {inspectingOfficer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-300" />
                  <span>{inspectingOfficer.officerName} - কার্যক্রম ও বিবরণী নিরীক্ষা</span>
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  {inspectingOfficer.unionName} • {inspectingOfficer.designation} • {inspectingOfficer.email}
                </p>
              </div>
              <button
                onClick={() => setInspectingOfficer(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-amber-100 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {isDataLoading ? (
                <div className="py-12 text-center text-stone-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-700 mb-2" />
                  <span>ক্লাউড ডেটাবেস থেকে তথ্য লোড হচ্ছে...</span>
                </div>
              ) : (
                <>
                  {/* Status Badges */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="text-stone-500 text-[10px]">নির্ধারিত সমিতি</div>
                      <div className="text-sm font-bold text-amber-950">
                        {toBengaliNumber(inspectData?.samities?.length || 0)} টি
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-stone-500 text-[10px]">কর্মদিবস বরাদ্দ</div>
                      <div className="text-sm font-bold text-emerald-900">
                        {toBengaliNumber(inspectData?.days?.filter((d) => !d.isHoliday)?.length || 0)} দিন
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="text-stone-500 text-[10px]">সংরক্ষিত রিপোর্ট</div>
                      <div className="text-sm font-bold text-blue-900">
                        {toBengaliNumber(inspectData?.reports?.length || 0)} টি
                      </div>
                    </div>
                  </div>

                  {/* Reports List for this officer as requested */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="px-3.5 py-2.5 bg-stone-100 font-bold text-stone-800 flex items-center justify-between border-b border-stone-200">
                      <span className="flex items-center gap-1.5">
                        <FileDown className="w-4 h-4 text-amber-700" />
                        এই কর্মকর্তার সংরক্ষিত রিপোর্টসমূহ ({toBengaliNumber(inspectData?.reports?.length || 0)}টি)
                      </span>
                    </div>
                    <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                      {inspectData?.reports && inspectData.reports.length > 0 ? (
                        inspectData.reports.map((rep) => (
                          <div
                            key={rep.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:bg-amber-50/40 transition"
                          >
                            <div>
                              <div className="font-bold text-stone-900 text-xs">{rep.monthYearLabel}</div>
                              <div className="text-[10.5px] text-stone-500 mt-0.5">
                                সংরক্ষিত: {rep.savedAtFormatted} • পরিদর্শন: {toBengaliNumber(rep.totalVisits)}টি • ছবি: {toBengaliNumber(rep.totalPhotos)}টি
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onInspectOfficer(inspectingOfficer.officerId, inspectingOfficer.officerName, inspectingOfficer.unionName);
                                setInspectingOfficer(null);
                              }}
                              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                            >
                              রিপোর্ট দেখুন
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-stone-500 text-center py-4 text-xs">
                          কোনো পূর্ববর্তী সংরক্ষিত রিপোর্ট নেই (চলতি মাসের ভ্রমণ বিবরণী প্রস্তুত রয়েছে)।
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Monthly Schedule Sample */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="px-3.5 py-2.5 bg-stone-100 font-bold text-stone-800 flex items-center justify-between border-b border-stone-200">
                      <span>চলতি মাসের ভ্রমণ সূচি ({formatBengaliMonthYear(currentMonth, currentYear)})</span>
                      <span className="text-[11px] text-stone-500">নমুনা দিনসমূহ</span>
                    </div>
                    <div className="p-3 max-h-36 overflow-y-auto space-y-1.5">
                      {inspectData?.days && inspectData.days.length > 0 ? (
                        inspectData.days.slice(0, 8).map((d) => (
                          <div
                            key={d.date}
                            className={`flex items-center justify-between p-1.5 rounded-lg text-[11px] ${
                              d.isHoliday ? 'bg-red-50 text-red-700' : 'bg-stone-50 text-stone-800'
                            }`}
                          >
                            <span className="font-medium">{d.date} ({d.dayNameBn})</span>
                            <span className="font-bold">{d.isHoliday ? (d.holidayReason || 'ছুটি') : d.samityName}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-stone-500 text-center py-2">সমিতি বণ্টনকৃত সূচি কার্যকর রয়েছে।</div>
                      )}
                    </div>
                  </div>

                  {/* Big Action button to switch whole app to this officer */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-stone-200">
                    <button
                      onClick={() => {
                        onInspectOfficer(inspectingOfficer.officerId, inspectingOfficer.officerName, inspectingOfficer.unionName);
                        setInspectingOfficer(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
                    >
                      <span>এই কর্মকর্তার সকল মেনু ও রিপোর্ট ওপেন করুন</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setInspectingOfficer(null)}
                      className="w-full sm:w-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold cursor-pointer"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {officerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-300 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900">ব্যবহারকারী মুছে ফেলার নিশ্চিতকরণ</h3>
                <p className="text-xs text-stone-500">এই পরিবর্তনটি স্থায়ী ও অপরিবর্তনযোগ্য</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-950 leading-relaxed">
              আপনি কি নিশ্চিতভাবে কর্মকর্তা <strong className="text-rose-900">"{officerToDelete.officerName}"</strong> ({officerToDelete.unionName})-এর সকল তথ্য, সমিতি তালিকা, দিনপঞ্জি এবং সংরক্ষিত রিপোর্ট ডেটাবেস থেকে মুছে ফেলতে চান?
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOfficerToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>মুছে ফেলা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, নিশ্চিত মুছে ফেলুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

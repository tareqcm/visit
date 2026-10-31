import React, { useState } from 'react';
import { WorkingDay, Samity } from '../types';
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Building2,
  Clock,
  Users,
} from 'lucide-react';
import {
  toBengaliNumber,
  BENGALI_MONTHS,
  BENGALI_DAYS,
  formatBengaliDate,
} from '../utils/bengaliNumerals';

interface CalendarManagerProps {
  days: WorkingDay[];
  year: number;
  month: number;
  onUpdateDays: (updatedDays: WorkingDay[]) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onRedistribute?: () => void;
  samities: Samity[];
}

// Sunday to Saturday week columns
const WEEK_DAYS = [
  { name: 'রবি', isWeekend: false },
  { name: 'সোম', isWeekend: false },
  { name: 'মঙ্গল', isWeekend: false },
  { name: 'বুধ', isWeekend: false },
  { name: 'বৃহঃ', isWeekend: false },
  { name: 'শুক্র', isWeekend: true },
  { name: 'শনি', isWeekend: true },
];

export const CalendarManager: React.FC<CalendarManagerProps> = ({
  days,
  year,
  month,
  onUpdateDays,
  onMonthChange,
  onYearChange,
  onRedistribute,
  samities,
}) => {
  // Default is 'calendar' as requested by the user, with 'list' alongside it
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const workingDaysCount = days.filter((d) => !d.isHoliday).length;
  const holidaysCount = days.filter((d) => d.isHoliday).length;
  const activeSamitiesCount = samities.filter((s) => s.active !== false).length;

  // Change day status via toggle or dropdown selection ("খোলা" or "বন্ধ")
  const handleStatusChange = (index: number, willBeHoliday: boolean) => {
    const updated = [...days];
    const target = updated[index];

    let newSamityId = willBeHoliday ? undefined : target.samityId;
    let newSamityName = willBeHoliday ? undefined : target.samityName;
    let newUnionName = willBeHoliday ? undefined : target.unionName;
    let newBranchName = willBeHoliday ? undefined : target.branchName;

    // If opening day and had no samity, assign first active samity as initial fallback
    if (!willBeHoliday && !newSamityId && samities.length > 0) {
      const activeList = samities.filter((s) => s.active !== false);
      const fallbackSamity = activeList[index % activeList.length] || activeList[0];
      if (fallbackSamity) {
        newSamityId = fallbackSamity.id;
        newSamityName = fallbackSamity.name;
        newUnionName = fallbackSamity.unionName;
        newBranchName = fallbackSamity.branchName;
      }
    }

    updated[index] = {
      ...target,
      isHoliday: willBeHoliday,
      holidayReason: willBeHoliday
        ? target.dayOfWeek === 5
          ? 'শুক্রবার সাপ্তাহিক ছুটি'
          : target.dayOfWeek === 6
          ? 'শনিবার সাপ্তাহিক ছুটি'
          : 'ব্যাংকিং ছুটি'
        : undefined,
      samityId: newSamityId,
      samityName: newSamityName,
      unionName: newUnionName,
      branchName: newBranchName,
    };

    onUpdateDays(updated);
  };

  // Change assigned samity for a specific day
  const handleSamityChange = (dayIndex: number, newSamityId: string) => {
    const updated = [...days];
    const target = updated[dayIndex];
    const selectedSamity = samities.find((s) => s.id === newSamityId);

    if (selectedSamity) {
      updated[dayIndex] = {
        ...target,
        samityId: selectedSamity.id,
        samityName: selectedSamity.name,
        unionName: selectedSamity.unionName,
        branchName: selectedSamity.branchName,
      };
    } else {
      updated[dayIndex] = {
        ...target,
        samityId: undefined,
        samityName: undefined,
        unionName: undefined,
      };
    }

    onUpdateDays(updated);
  };

  // Change remarks for a specific day
  const handleRemarksChange = (dayIndex: number, remarks: string) => {
    const updated = [...days];
    updated[dayIndex] = {
      ...updated[dayIndex],
      remarks,
    };
    onUpdateDays(updated);
  };

  // Reset to default (Friday and Saturday weekly holiday, others open)
  const handleResetBankingHolidays = () => {
    const updated = days.map((day) => {
      const isWeekend = day.dayOfWeek === 5 || day.dayOfWeek === 6;
      return {
        ...day,
        isHoliday: isWeekend,
        holidayReason: isWeekend
          ? day.dayOfWeek === 5
            ? 'শুক্রবার সাপ্তাহিক ছুটি'
            : 'শনিবার সাপ্তাহিক ছুটি'
          : undefined,
        samityId: isWeekend ? undefined : day.samityId,
        samityName: isWeekend ? undefined : day.samityName,
        unionName: isWeekend ? undefined : day.unionName,
        branchName: isWeekend ? undefined : day.branchName,
      };
    });
    onUpdateDays(updated);
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    if (month === 0) {
      onYearChange(year - 1);
      onMonthChange(11);
    } else {
      onMonthChange(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      onYearChange(year + 1);
      onMonthChange(0);
    } else {
      onMonthChange(month + 1);
    }
  };

  const handleSaveAndSubmit = () => {
    onUpdateDays([...days]);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  // Sunday=0, Monday=1, ..., Saturday=6
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const leadingBlankCount = firstDayOfMonth;

  return (
    <div className={`w-full mx-auto space-y-3 transition-all duration-200 ${viewMode === 'calendar' ? 'max-w-lg' : 'max-w-5xl'}`}>
      {/* 1. TOP HEADER & CONTROLS CARD (Matching image_9d0530a8.png) */}
      <div className={`bg-white rounded-2xl shadow-xs border border-amber-200/80 transition-all ${viewMode === 'calendar' ? 'p-3 sm:p-4' : 'p-4 sm:p-5'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Icon & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                {BENGALI_MONTHS[month]} {toBengaliNumber(year)} - মাসিক ক্যালেন্ডার
              </h2>
            </div>
          </div>

          {/* Right: View Mode Toggle & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: [📅 ক্যালেন্ডার] [≡ তালিকা] */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>ক্যালেন্ডার</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>তালিকা</span>
              </button>
            </div>

            {/* Month Nav Buttons */}
            <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-white rounded transition text-stone-600 hover:text-stone-900 cursor-pointer"
                title="পূর্ববর্তী মাস"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-stone-800 text-xs">
                {BENGALI_MONTHS[month]}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-white rounded transition text-stone-600 hover:text-stone-900 cursor-pointer"
                title="পরবর্তী মাস"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month & Year Selectors */}
            <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-stone-300 font-bold text-stone-800 text-xs shadow-2xs">
              <select
                value={month}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-stone-800 font-bold focus:outline-hidden cursor-pointer"
              >
                {BENGALI_MONTHS.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
              <span className="mx-1 text-stone-400">/</span>
              <select
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-stone-800 font-bold focus:outline-hidden cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {toBengaliNumber(y)}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Redistribute Samities */}
            {onRedistribute && (
              <button
                type="button"
                onClick={onRedistribute}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                title="খোলা কর্মদিবসগুলোতে সমিতি সমবণ্টন করুন"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>সমিতি বণ্টন</span>
              </button>
            )}

            {/* Reset Banking Holidays */}
            <button
              type="button"
              onClick={handleResetBankingHolidays}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              title="শুক্রবার ও শনিবার সাপ্তাহিক ছুটি হিসেবে ডিফল্ট রিসেট করুন"
            >
              <RotateCcw className="w-3 h-3 text-rose-600" />
              <span>ব্যাংক ছুটি রিসেট</span>
            </button>
          </div>
        </div>

        {/* 2. STATS SUMMARY CARDS (4 cards matching image_9d0530a8.png) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-3 border-t border-amber-100">
          {/* Card 1: Total Days */}
          <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-2.5 text-center">
            <span className="text-[11px] font-semibold text-stone-500 block">
              মাসের মোট দিন
            </span>
            <span className="text-sm sm:text-base font-black text-stone-800 mt-0.5 block">
              {toBengaliNumber(days.length)} দিন
            </span>
          </div>

          {/* Card 2: Holidays */}
          <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-2.5 text-center">
            <span className="text-[11px] font-bold text-rose-600 flex items-center justify-center gap-1">
              <Building2 className="w-3 h-3" />
              ব্যাংকিং ও সাপ্তাহিক ছুটি
            </span>
            <span className="text-sm sm:text-base font-black text-rose-700 mt-0.5 block">
              {toBengaliNumber(holidaysCount)} দিন
            </span>
          </div>

          {/* Card 3: Working Days */}
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-2.5 text-center">
            <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              খোলা কর্মদিবস
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-800 mt-0.5 block">
              {toBengaliNumber(workingDaysCount)} দিন
            </span>
          </div>

          {/* Card 4: Active Samities */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 text-center">
            <span className="text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              সক্রিয় সমিতি
            </span>
            <span className="text-sm sm:text-base font-black text-amber-900 mt-0.5 block">
              {toBengaliNumber(activeSamitiesCount)} টি
            </span>
          </div>
        </div>
      </div>

      {/* 3. VIEW 1: COMPACT MOBILE-FRIENDLY MONTH CALENDAR (DEFAULT VIEW) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xs border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
              ক্যালেন্ডার ছক (১ বার টাচে খোলা/বন্ধ):
            </span>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="text-amber-700 hover:text-amber-900 text-[11px] font-bold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>তালিকা ভিউ দেখুন</span>
            </button>
          </div>

          {/* Compact 7-column Mobile Calendar Grid */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            {/* Day Name Header Row */}
            <div className="grid grid-cols-7 bg-slate-100/90 border-b border-slate-200 text-center py-1">
              {WEEK_DAYS.map((col, idx) => (
                <div
                  key={idx}
                  className={`text-[11px] font-bold ${
                    col.isWeekend ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {col.name}
                </div>
              ))}
            </div>

            {/* Calendar Cells (Compact & Mobile-friendly) */}
            <div className="grid grid-cols-7 gap-1 p-1 bg-slate-50/30">
              {/* Blank offset cells before the 1st of month */}
              {Array.from({ length: leadingBlankCount }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-[46px] bg-transparent" />
              ))}

              {/* Day Cells (Single tap to toggle - No dropdown) */}
              {days.map((day, idx) => {
                const isOff = day.isHoliday;

                return (
                  <button
                    type="button"
                    key={day.date}
                    onClick={() => handleStatusChange(idx, !isOff)}
                    className={`rounded-lg p-1 flex flex-col items-center justify-between h-[46px] border transition-all active:scale-95 cursor-pointer select-none touch-manipulation ${
                      isOff
                        ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100/70 shadow-2xs'
                        : 'border-emerald-300 bg-white text-slate-800 hover:bg-emerald-50/50 shadow-2xs'
                    }`}
                    title={
                      isOff
                        ? `${formatBengaliDate(day.date)}: বন্ধ (টাচ করে খোলা করুন)`
                        : `${formatBengaliDate(day.date)}: খোলা (টাচ করে বন্ধ করুন)`
                    }
                  >
                    {/* Top Row: Date Number and Status indicator dot */}
                    <div className="w-full flex items-center justify-between px-0.5 leading-none">
                      <span
                        className={`text-[12px] font-black ${
                          isOff ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {toBengaliNumber(day.dayOfMonth)}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOff ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    {/* Bottom Row: Clear Status Label (খোলা / বন্ধ) */}
                    <span
                      className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${
                        isOff
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOff
                        ? day.dayOfWeek === 5
                          ? 'ছুটি (শুক্র)'
                          : day.dayOfWeek === 6
                          ? 'ছুটি (শনি)'
                          : 'বন্ধ'
                        : 'খোলা'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Tip for Mobile Touch */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5 text-[11px] text-amber-900 leading-snug">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p>
              <span className="font-bold">টিপস:</span> যেকোনো তারিখে ১ বার স্পর্শ করলেই দিনটি সরাসরি <span className="font-bold text-rose-700">"বন্ধ"</span> বা <span className="font-bold text-emerald-700">"খোলা"</span> হবে।
            </p>
          </div>

          {/* Save & Update Button */}
          <div className="flex items-center justify-between pt-0.5">
            <div>
              {savedSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-in fade-in">
                  <Check className="w-3 h-3 text-emerald-600" />
                  সংরক্ষিত হয়েছে!
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveAndSubmit}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer ml-auto"
            >
              সংরক্ষণ ও আপডেট করুন
            </button>
          </div>
        </div>
      )}

      {/* 4. VIEW 2: DETAILED LIST TABLE (EXACT MATCH TO image_9d0530a8.png) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
          {/* Table Header Banner */}
          <div className="bg-stone-50/80 px-4 py-3 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold text-stone-700">
              দৈনিক বিবরণ ও পরিদর্শন তালিকা{' '}
              <span className="text-stone-500 font-normal">
                (ছুটি/খোলা বাটনে ক্লিক করে পরিবর্তন করতে পারবেন)
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                খোলা
              </span>
              <span className="inline-flex items-center gap-1 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                বন্ধ/ছুটি
              </span>
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 text-[11.5px] font-black">
                  <th className="py-2.5 px-3 text-center w-12">নং</th>
                  <th className="py-2.5 px-3 w-48">তারিখ ও বার</th>
                  <th className="py-2.5 px-3 text-center w-28">অবস্থা</th>
                  <th className="py-2.5 px-3 min-w-[240px]">বরাদ্দকৃত সমিতি</th>
                  <th className="py-2.5 px-3 w-44">ইউনিয়ন</th>
                  <th className="py-2.5 px-3 w-36">মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {days.map((day, idx) => {
                  const isOff = day.isHoliday;
                  const dayName = BENGALI_DAYS[day.dayOfWeek] || day.dayNameBn;

                  return (
                    <tr
                      key={day.date}
                      className={`transition ${
                        isOff
                          ? 'bg-rose-50/15 hover:bg-rose-50/30 text-rose-900'
                          : 'hover:bg-amber-50/20 text-stone-800'
                      }`}
                    >
                      {/* 1. Serial No */}
                      <td className="py-2.5 px-3 text-center font-bold text-stone-500">
                        {toBengaliNumber(idx + 1)}
                      </td>

                      {/* 2. Date & Day */}
                      <td className="py-2.5 px-3 font-semibold">
                        {isOff ? (
                          <div className="text-rose-600 leading-tight">
                            <div className="font-bold">{formatBengaliDate(day.date)}</div>
                            <div className="text-[11px] font-medium mt-0.5">
                              {dayName} ({day.holidayReason || (day.dayOfWeek === 5 ? 'শুক্রবার সাপ্তাহিক ছুটি' : day.dayOfWeek === 6 ? 'শনিবার সাপ্তাহিক ছুটি' : 'ছুটি')})
                            </div>
                          </div>
                        ) : (
                          <div className="text-stone-800 leading-tight">
                            <div className="font-bold">{formatBengaliDate(day.date)}</div>
                            <div className="text-[11px] text-stone-500 mt-0.5">{dayName}</div>
                          </div>
                        )}
                      </td>

                      {/* 3. Status Button (Clickable toggle matching image) */}
                      <td className="py-2.5 px-3 text-center">
                        {isOff ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(idx, false)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer shadow-2xs w-20"
                            title="ক্লিক করে খোলা করুন"
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
                            <span>ছুটি</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(idx, true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shadow-2xs w-20"
                            title="ক্লিক করে ছুটি করুন"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                            <span>খোলা</span>
                          </button>
                        )}
                      </td>

                      {/* 4. Allocated Samity Select Dropdown */}
                      <td className="py-2.5 px-3">
                        {isOff ? (
                          <span className="text-stone-400 text-xs italic font-medium">
                            ছুটির দিন (পরিদর্শন নেই)
                          </span>
                        ) : (
                          <div className="relative max-w-md">
                            <select
                              value={day.samityId || ''}
                              onChange={(e) => handleSamityChange(idx, e.target.value)}
                              className="w-full text-xs font-bold py-1.5 px-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 hover:border-amber-400 focus:border-amber-500 focus:outline-hidden cursor-pointer shadow-2xs transition"
                            >
                              <option value="">-- সমিতি নির্বাচন করুন --</option>
                              {samities
                                .filter((s) => s.active !== false)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.unionName})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </td>

                      {/* 5. Union Name */}
                      <td className="py-2.5 px-3 font-medium text-stone-600">
                        {isOff ? '-' : day.unionName || '১৩নং ইসলামপুর'}
                      </td>

                      {/* 6. Remarks Input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={day.remarks || ''}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          placeholder="মন্তব্য"
                          disabled={isOff}
                          className={`w-full text-xs px-2.5 py-1.5 rounded-md border text-stone-700 transition ${
                            isOff
                              ? 'border-transparent bg-transparent text-stone-300 cursor-not-allowed'
                              : 'border-stone-200 bg-stone-50/60 hover:bg-white focus:bg-white focus:border-amber-400 focus:outline-hidden'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Save Button */}
          <div className="bg-stone-50/80 px-4 py-3 border-t border-stone-200 flex items-center justify-between">
            <div>
              {savedSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  সংরক্ষিত ও আপডেট হয়েছে!
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveAndSubmit}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer ml-auto"
            >
              সংরক্ষণ ও আপডেট করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

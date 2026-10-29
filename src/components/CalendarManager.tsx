import React from 'react';
import { WorkingDay, Samity } from '../types';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, RotateCcw, Shuffle, Info } from 'lucide-react';
import { toBengaliNumber, BENGALI_MONTHS, formatBengaliDate } from '../utils/bengaliNumerals';

interface CalendarManagerProps {
  days: WorkingDay[];
  year: number;
  month: number;
  onUpdateDays: (updatedDays: WorkingDay[]) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onRedistribute: () => void;
  samities: Samity[];
}

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
  const workingDaysCount = days.filter((d) => !d.isHoliday).length;
  const holidaysCount = days.filter((d) => d.isHoliday).length;
  const activeSamitiesCount = samities.filter((s) => s.active).length;

  const toggleDayStatus = (index: number) => {
    const updated = [...days];
    const target = updated[index];
    const willBeHoliday = !target.isHoliday;

    updated[index] = {
      ...target,
      isHoliday: willBeHoliday,
      holidayReason: willBeHoliday
        ? target.dayOfWeek === 5 || target.dayOfWeek === 6
          ? 'সাপ্তাহিক ছুটি'
          : 'বিশেষ ছুটি'
        : undefined,
      samityId: willBeHoliday ? undefined : target.samityId,
      samityName: willBeHoliday ? undefined : target.samityName,
      unionName: willBeHoliday ? undefined : target.unionName,
      branchName: willBeHoliday ? undefined : target.branchName,
    };

    onUpdateDays(updated);
  };

  const handleSamityChangeForDay = (index: number, samityId: string) => {
    const updated = [...days];
    const selectedSamity = samities.find((s) => s.id === samityId);
    if (!selectedSamity) return;

    updated[index] = {
      ...updated[index],
      samityId: selectedSamity.id,
      samityName: selectedSamity.name,
      unionName: selectedSamity.unionName,
      branchName: selectedSamity.branchName || 'রাঙ্গুনিয়া',
    };

    onUpdateDays(updated);
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], remarks };
    onUpdateDays(updated);
  };

  return (
    <div className="space-y-4">
      {/* Top Controller & Stats */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">মাসিক খোলা ও বন্ধ ক্যালেন্ডার</h2>
              <p className="text-xs text-stone-500">
                শুক্রবার ও শনিবার স্বয়ংক্রিয় ব্যাংক ছুটি। যেকোনো তারিখে ট্যাপ করে খোলা/ছুটি বদলান।
              </p>
            </div>
          </div>

          {/* Month & Year Selector */}
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {BENGALI_MONTHS.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {toBengaliNumber(y)}
                </option>
              ))}
            </select>

            <button
              onClick={onRedistribute}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
              title="খোলা দিনগুলোতে সমিতি বণ্টন করুন"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">সমিতি বণ্টন</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-amber-100">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
            <p className="text-[11px] text-stone-500 font-medium">মাসের মোট দিন</p>
            <p className="text-lg font-bold text-stone-800">{toBengaliNumber(days.length)} দিন</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
            <p className="text-[11px] text-rose-600 font-medium">ছুটির দিন</p>
            <p className="text-lg font-bold text-rose-700">{toBengaliNumber(holidaysCount)} দিন</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-[11px] text-amber-800 font-medium">নির্ধারিত কর্মদিবস</p>
            <p className="text-lg font-bold text-amber-900">{toBengaliNumber(workingDaysCount)} দিন</p>
          </div>
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-center">
            <p className="text-[11px] text-yellow-800 font-medium">দায়িত্বরত সমিতি</p>
            <p className="text-lg font-bold text-yellow-900">{toBengaliNumber(activeSamitiesCount)} টি</p>
          </div>
        </div>
      </div>

      {/* Calendar Table List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span>দৈনিক বিবরণ ও পরিদর্শন তালিকা</span>
            <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
              (ছুটি/খোলা বাটনে ক্লিক করে পরিবর্তন করতে পারবেন)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> খোলা
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> ছুটি
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">নং</th>
                <th className="py-2.5 px-3 w-36">তারিখ ও বার</th>
                <th className="py-2.5 px-3 text-center w-28">অবস্থা</th>
                <th className="py-2.5 px-3">বরাদ্দকৃত সমিতি</th>
                <th className="py-2.5 px-3 w-36 hidden sm:table-cell">ইউনিয়ন</th>
                <th className="py-2.5 px-3 w-28 hidden md:table-cell">মন্তব্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.map((day, idx) => {
                const isOff = day.isHoliday;

                return (
                  <tr
                    key={day.date}
                    className={`transition ${
                      isOff ? 'bg-rose-50/30 text-slate-500' : 'hover:bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-500">
                      {toBengaliNumber(day.dayOfMonth)}
                    </td>

                    {/* Date & Day */}
                    <td className="py-2.5 px-3 font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{formatBengaliDate(day.date)}</span>
                        <span className={`text-[11px] ${isOff ? 'text-rose-500 font-semibold' : 'text-slate-500'}`}>
                          {day.dayNameBn} {day.holidayReason ? `(${day.holidayReason})` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle Button */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => toggleDayStatus(idx)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                          isOff
                            ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                        }`}
                      >
                        {isOff ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ছুটি</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>খোলা</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Assigned Samity */}
                    <td className="py-2.5 px-3">
                      {isOff ? (
                        <span className="italic text-slate-400 text-xs">ছুটির দিন (পরিদর্শন নেই)</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={day.samityId || ''}
                            onChange={(e) => handleSamityChangeForDay(idx, e.target.value)}
                            className="w-full max-w-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="">-- সমিতি নির্বাচন করুন --</option>
                            {samities
                              .filter((s) => s.active)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.unionName})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </td>

                    {/* Union Name */}
                    <td className="py-2.5 px-3 text-xs text-slate-600 hidden sm:table-cell">
                      {isOff ? '-' : day.unionName || '১৩নং ইসলামপুর'}
                    </td>

                    {/* Remarks */}
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      {!isOff && (
                        <input
                          type="text"
                          placeholder="মন্তব্য"
                          value={day.remarks || ''}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

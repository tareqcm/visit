import React from 'react';
import { SavedMonthlyReport } from '../types';
import { FolderArchive, Calendar, Camera, FileDown, Eye, Trash2, Clock, CheckCircle } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliNumerals';

interface SavedReportsViewProps {
  savedReports: SavedMonthlyReport[];
  onLoadReport: (report: SavedMonthlyReport) => void;
  onDownloadReportPDF: (report: SavedMonthlyReport) => void;
  onDeleteReport: (reportId: string) => void;
  currentActiveMonthYear: string;
}

export const SavedReportsView: React.FC<SavedReportsViewProps> = ({
  savedReports,
  onLoadReport,
  onDownloadReportPDF,
  onDeleteReport,
  currentActiveMonthYear,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-amber-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">সংরক্ষিত রিপোর্ট আর্কাইভ</h2>
              <p className="text-xs text-stone-500">
                যেকোনো মাসের ভ্রমণ বিবরণী ও স্থিরচিত্র সেভ করে রাখলে তা এখানে সংরক্ষিত থাকে।
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-100/80 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle className="w-4 h-4 text-amber-700" />
            <span>মোট সংরক্ষিত: {toBengaliNumber(savedReports.length)} টি মাস</span>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
          <span>💡</span>
          <span>
            যেকোনো মাসের রিপোর্ট তৈরি করার পর উপরে <strong>"রিপোর্ট সেভ করুন"</strong> বাটনে চাপ দিলে তা স্বয়ংক্রিয়ভাবে উক্ত মাসের ছবি ও ছক সহ এখানে সংরক্ষণ হবে।
          </span>
        </div>
      </div>

      {/* Reports List */}
      {savedReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <FolderArchive className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">কোনো সংরক্ষিত রিপোর্ট পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            বর্তমান মাসের ভ্রমণ বিবরণী ও ছবি প্রস্তুত করে উপরের <strong>"রিপোর্ট সেভ করুন"</strong> বাটনে ক্লিক করলে তা এখানে স্থায়ীভাবে সংরক্ষিত থাকবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedReports.map((report) => {
            const isCurrentlyActive = currentActiveMonthYear === report.id;

            return (
              <div
                key={report.id}
                className={`bg-white rounded-2xl border p-4.5 transition shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isCurrentlyActive
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : 'border-amber-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <h3 className="text-base font-bold text-stone-900">
                        {report.monthYearLabel}
                      </h3>
                      {isCurrentlyActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold border border-amber-300">
                          বর্তমান সক্রিয়
                        </span>
                      )}
                    </div>

                    {confirmDeleteId === report.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg animate-in fade-in">
                        <span className="text-[11px] font-bold text-rose-800">মুছবেন?</span>
                        <button
                          onClick={() => {
                            onDeleteReport(report.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold transition cursor-pointer"
                        >
                          হ্যাঁ
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-[11px] transition cursor-pointer"
                        >
                          না
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(report.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="রিপোর্টটি মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Summary Details */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <p className="text-[10px] text-stone-500">মাঠ পরিদর্শন</p>
                        <p className="font-bold text-stone-800">{toBengaliNumber(report.totalVisits)} টি সমিতি</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-stone-500">স্থিরচিত্র</p>
                        <p className="font-bold text-stone-800">{toBengaliNumber(report.totalPhotos)} টি ছবি</p>
                      </div>
                    </div>
                  </div>

                  {/* Saved Timestamp */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-500">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>সংরক্ষণ সময়: {report.savedAtFormatted}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center gap-2">
                  <button
                    onClick={() => onLoadReport(report)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-950 text-xs font-bold transition active:scale-95 border border-amber-200"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-700" />
                    <span>লোড ও দেখুন</span>
                  </button>

                  <button
                    onClick={() => onDownloadReportPDF(report)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition active:scale-95 border border-amber-500"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>পিডিএফ ডাউনলোড</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

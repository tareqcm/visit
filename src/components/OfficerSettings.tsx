import React from 'react';
import { OfficerInfo } from '../types';
import { User, Building, FileText, Calendar, Edit3, RotateCcw } from 'lucide-react';
import { DEFAULT_OFFICER_INFO } from '../utils/initialData';

interface OfficerSettingsProps {
  officerInfo: OfficerInfo;
  onUpdateOfficerInfo: (info: OfficerInfo) => void;
  signatureUrl: string;
  onOpenSignatureModal: () => void;
}

export const OfficerSettings: React.FC<OfficerSettingsProps> = ({
  officerInfo,
  onUpdateOfficerInfo,
  signatureUrl,
  onOpenSignatureModal,
}) => {
  const handleChange = (field: keyof OfficerInfo, value: string | number) => {
    onUpdateOfficerInfo({
      ...officerInfo,
      [field]: value,
    });
  };

  const handleReset = () => {
    if (confirm('অফিসার ও শাখার তথ্য ডিফল্ট মানে রিসেট করতে চান?')) {
      onUpdateOfficerInfo(DEFAULT_OFFICER_INFO);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-amber-200/80">
        <div className="flex items-center justify-between pb-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-950">অফিসার ও শাখা সেটিংস</h2>
              <p className="text-xs text-stone-500">ভ্রমণ বিবরণী রিপোর্টের হেডার, ফুটার ও অফিশিয়াল তথ্য</p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-amber-50 border border-stone-200"
            title="ডিফল্ট তথ্যে ফিরিয়ে নিন"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Officer Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              ফিল্ড অফিসারের নাম *
            </label>
            <input
              type="text"
              value={officerInfo.officerName}
              onChange={(e) => handleChange('officerName', e.target.value)}
              placeholder="মো: তারেকুল ইসলাম"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              পদবী *
            </label>
            <input
              type="text"
              value={officerInfo.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              placeholder="ফিল্ড অ্যাসিস্ট্যান্ট অফিসার"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-700" />
              ব্যাংকের নাম *
            </label>
            <input
              type="text"
              value={officerInfo.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="পল্লী সঞ্চয় ব্যাংক"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Branch Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-700" />
              শাখা ও জেলা *
            </label>
            <input
              type="text"
              value={officerInfo.branchName}
              onChange={(e) => handleChange('branchName', e.target.value)}
              placeholder="রাঙ্গুনিয়া শাখা, চট্টগ্রাম।"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Smarok / Memo Number */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              স্মারক নম্বর *
            </label>
            <input
              type="text"
              value={officerInfo.smarokNo}
              onChange={(e) => handleChange('smarokNo', e.target.value)}
              placeholder="পসব/প্রকা/প্রশা-১৩৮/২০২৪-২৫/২৯৫১"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Smarok Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              স্মারক তারিখ *
            </label>
            <input
              type="text"
              value={officerInfo.smarokDate}
              onChange={(e) => handleChange('smarokDate', e.target.value)}
              placeholder="১৫/০৫/২০২৫"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Signature Box */}
        <div className="mt-6 pt-5 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-950">অফিসারের স্বাক্ষর</h3>
            <p className="text-xs text-stone-500">পিডিএফের ১ম ও ২য় উভয় পৃষ্ঠার নিচে এই স্বাক্ষর সংযুক্ত হবে</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-14 w-32 border border-amber-200 rounded-xl bg-amber-50/40 p-1 flex items-center justify-center overflow-hidden">
              <img src={signatureUrl} alt="Officer Signature" className="max-h-full max-w-full object-contain" />
            </div>

            <button
              onClick={onOpenSignatureModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 text-xs font-bold transition shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              স্বাক্ষর পরিবর্তন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

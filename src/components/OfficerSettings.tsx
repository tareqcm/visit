import React, { useState, useEffect } from 'react';
import { OfficerInfo } from '../types';
import {
  User,
  Building,
  FileText,
  Calendar,
  Edit3,
  RotateCcw,
  ShieldCheck,
  Users,
  MapPin,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_OFFICER_INFO } from '../utils/initialData';

interface OfficerSettingsProps {
  officerInfo: OfficerInfo;
  onUpdateOfficerInfo: (info: OfficerInfo) => void;
  signatureUrl: string;
  onOpenSignatureModal: () => void;
  onOpenAuthModal?: () => void;
}

export const OfficerSettings: React.FC<OfficerSettingsProps> = ({
  officerInfo,
  onUpdateOfficerInfo,
  signatureUrl,
  onOpenSignatureModal,
  onOpenAuthModal,
}) => {
  const [formData, setFormData] = useState<OfficerInfo>(officerInfo);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(officerInfo);
  }, [officerInfo]);

  const handleChange = (field: keyof OfficerInfo, value: string | number) => {
    const updated = {
      ...formData,
      [field]: value,
    };
    setFormData(updated);
    onUpdateOfficerInfo(updated);
  };

  const handleSave = () => {
    onUpdateOfficerInfo(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  const handleReset = () => {
    if (confirm('অফিসার ও শাখার তথ্য ডিফল্ট মানে রিসেট করতে চান?')) {
      setFormData(DEFAULT_OFFICER_INFO);
      onUpdateOfficerInfo(DEFAULT_OFFICER_INFO);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Helpful guidance banner on multi-officer data isolation & name customization */}
      <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs text-amber-950 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                <span>নিজস্ব নাম ও আলাদা ডেটা ব্যবহারের নির্দেশিকা</span>
              </h3>
              {onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] shadow-xs transition"
                >
                  <Users className="w-3 h-3" />
                  অফিসার পরিবর্তন / লগইন
                </button>
              )}
            </div>
            <p className="leading-relaxed text-stone-700">
              <strong>১. নাম ও শাখা পরিবর্তন:</strong> নিচের বক্সে আপনার নিজের নাম, পদবী, শাখা ও জেলার নাম লিখে দিন। সাথে সাথে ভ্রমণ বিবরণী ও ডাউনলোডকৃত পিডিএফ রিপোর্টে তা প্রদর্শিত হবে।
            </p>
            <p className="leading-relaxed text-stone-700">
              <strong>২. শতভাগ পৃথক ডেটা:</strong> ফায়ারবেস ক্লাউডের মাধ্যমে প্রত্যেক অফিসারের সমিতি, দিনপঞ্জি, ছবি ও সংরক্ষিত রিপোর্ট সম্পূর্ণ আলাদা সুরক্ষিত ভল্টে থাকে। একজনের ডেটার সাথে অন্যের ডেটা কখনো মিশবে না।
            </p>
          </div>
        </div>
      </div>

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
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-amber-50 border border-stone-200 cursor-pointer"
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
              value={formData.officerName}
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
              value={formData.designation}
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
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="পল্লী সঞ্চয় ব্যাংক"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Branch Name Field (Separate) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-700" />
              শাখার নাম *
            </label>
            <input
              type="text"
              value={formData.branchName}
              onChange={(e) => handleChange('branchName', e.target.value)}
              placeholder="যেমন: রাঙ্গুনিয়া শাখা"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* District Name Field (Separate) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              জেলার নাম *
            </label>
            <input
              type="text"
              value={formData.districtName || ''}
              onChange={(e) => handleChange('districtName', e.target.value)}
              placeholder="যেমন: চট্টগ্রাম"
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
              value={formData.smarokNo}
              onChange={(e) => handleChange('smarokNo', e.target.value)}
              placeholder="পসব/প্রকা/প্রশা-১৩৮/২০২৪-২৫/২৯৫১"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Smarok Date */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              স্মারক তারিখ *
            </label>
            <input
              type="text"
              value={formData.smarokDate}
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
              type="button"
              onClick={onOpenSignatureModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              স্বাক্ষর পরিবর্তন
            </button>
          </div>
        </div>

        {/* Dedicated Save Button at Bottom */}
        <div className="mt-6 pt-5 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            {isSaved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                সকল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!
              </span>
            ) : (
              <span className="text-stone-500 font-medium">
                শাখা, জেলা ও সকল তথ্য পরিবর্তনের পর সংরক্ষণ করতে সেভ বাটনে চাপুন।
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition transform active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>সকল তথ্য সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};

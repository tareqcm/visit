import React, { useState, useEffect } from 'react';
import { Samity } from '../types';
import {
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  MapPin,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { RANGUNIA_UNIONS } from '../utils/initialData';
import { formatSamityNameWithSuffix } from './SamityManager';

interface SamitySetupWizardProps {
  isOpen: boolean;
  onComplete: (samities: Samity[]) => void;
  defaultUnion?: string;
  officerName?: string;
  existingSamities?: Samity[];
}

const STORAGE_DEFAULT_UNION = 'vromon_selected_default_union';

/**
 * Detect if the list is the sample dummy data so we never display
 * another person's mock societies to newly registered officers.
 */
export const isDefaultSampleList = (list?: Samity[]): boolean => {
  if (!list || list.length === 0) return false;
  return (
    list.length === 12 &&
    list[0]?.id === '1' &&
    list[0]?.name?.includes('রৈস্যাবিলি')
  );
};

export const SamitySetupWizard: React.FC<SamitySetupWizardProps> = ({
  isOpen,
  onComplete,
  defaultUnion = '১৩নং ইসলামপুর',
  officerName,
  existingSamities = [],
}) => {
  // Samities list being built - for a newly registered user, start clean and empty!
  // Only the societies added by this officer will show up below.
  const [samityList, setSamityList] = useState<Samity[]>(() => {
    if (existingSamities && existingSamities.length > 0 && !isDefaultSampleList(existingSamities)) {
      return existingSamities;
    }
    return [];
  });

  // Synchronize when wizard opens
  useEffect(() => {
    if (isOpen) {
      if (existingSamities && existingSamities.length > 0 && !isDefaultSampleList(existingSamities)) {
        setSamityList(existingSamities);
      } else {
        setSamityList([]);
      }
      setSamityInput('');
      setInputError(null);
    }
  }, [isOpen, existingSamities]);

  // Current Input Fields
  const [samityInput, setSamityInput] = useState('');
  const [selectedUnion, setSelectedUnion] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DEFAULT_UNION);
      return saved || defaultUnion;
    } catch {
      return defaultUnion;
    }
  });

  const [inputError, setInputError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Union Change & remember persistently
  const handleUnionChange = (union: string) => {
    setSelectedUnion(union);
    try {
      localStorage.setItem(STORAGE_DEFAULT_UNION, union);
    } catch {
      // ignore
    }
  };

  // Add a Samity to list
  const handleAddSamity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = samityInput.trim();
    if (!raw) {
      setInputError('অনুগ্রহ করে সমিতির নামটি লিখুন।');
      return;
    }

    // Automatically append "গ্রাম উন্নয়ন সমিতি"
    const fullName = formatSamityNameWithSuffix(raw);

    // Check duplicate
    if (samityList.some((s) => s.name.trim() === fullName.trim())) {
      setInputError('এই সমিতিটি তালিকায় ইতিমধ্যে যুক্ত রয়েছে।');
      return;
    }

    const newSamity: Samity = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: fullName,
      unionName: selectedUnion || '১৩নং ইসলামপুর',
      active: true,
    };

    setSamityList((prev) => [...prev, newSamity]);
    setSamityInput('');
    setInputError(null);
  };

  // Remove a samity from list
  const handleRemove = (id: string) => {
    setSamityList((prev) => prev.filter((s) => s.id !== id));
  };

  // Final "OK" click
  const handleFinish = () => {
    if (samityList.length === 0) {
      setInputError('কমপক্ষে ১টি সমিতি যুক্ত করুন।');
      return;
    }
    onComplete(samityList);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-amber-300 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 p-2 flex items-center justify-center border border-white/30 shrink-0">
              <Building2 className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                সমিতি এন্ট্রি ও তালিকা নির্ধারণ
              </h2>
              <p className="text-xs text-amber-200">
                {officerName ? `${officerName} • ` : ''}আপনার সমিতিগুলো একে একে যুক্ত করুন
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] bg-white/20 px-2.5 py-1 rounded-full text-white font-bold border border-white/30">
              ধাপ: সমিতি সেটাপ
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Instructions Box */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">নিয়ম:</span> সমিতির নাম লিখলে <strong className="text-amber-900">"গ্রাম উন্নয়ন সমিতি"</strong> স্বয়ংক্রিয়ভাবে যুক্ত হবে। পাশে ইউনিয়ন সিলেক্ট করে <strong className="text-amber-900">"এড করুন"</strong> এ চাপুন। সবগুলো সমিতি এড করা শেষ হলে নিচে <strong className="text-emerald-800">"ওকে (সম্পন্ন করুন)"</strong> বাটনে চাপলেই ভ্রমণ রিপোর্ট তৈরি শুরু করতে পারবেন।
            </div>
          </div>

          {/* Entry Form (Name + Union + Add Button) */}
          <form onSubmit={handleAddSamity} className="bg-stone-50/80 border border-stone-200 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* 1. Samity Name Input */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  সমিতির নাম * <span className="text-[10.5px] font-normal text-amber-800">(অটো সেভ হবে)</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: রৈস্যাবিলি বা গুল মোহাম্মদপাড়া"
                  value={samityInput}
                  onChange={(e) => {
                    setSamityInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white text-stone-900"
                />
              </div>

              {/* 2. Union Selection */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ইউনিয়ন * <span className="text-[10.5px] font-normal text-amber-800">(ডিফল্ট থাকবে)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedUnion}
                    onChange={(e) => handleUnionChange(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white font-bold text-stone-800 cursor-pointer"
                  >
                    {RANGUNIA_UNIONS.map((union) => (
                      <option key={union} value={union}>
                        {union}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Add Button */}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>এড করুন</span>
                </button>
              </div>
            </div>

            {/* Real-time Name Preview */}
            {samityInput.trim() && (
              <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  সংরক্ষিত পূর্ণ নাম: <strong className="underline decoration-emerald-500">{formatSamityNameWithSuffix(samityInput)}</strong> ({selectedUnion})
                </span>
              </div>
            )}

            {/* Error Message */}
            {inputError && (
              <p className="text-xs text-rose-600 font-bold">{inputError}</p>
            )}
          </form>

          {/* Added Samities List Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-stone-100/80 px-3.5 py-2 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                যুক্ত হওয়া সমিতির তালিকা
              </span>
              <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-[11px] font-black border border-amber-300">
                মোট: {toBengaliNumber(samityList.length)} টি সমিতি
              </span>
            </div>

            {samityList.length > 0 ? (
              <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 text-xs">
                {samityList.map((samity, idx) => (
                  <div
                    key={samity.id || idx}
                    className="p-2.5 px-3.5 flex items-center justify-between hover:bg-amber-50/30 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {toBengaliNumber(idx + 1)}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-stone-900 block truncate">
                          {samity.name}
                        </span>
                        <span className="text-[11px] text-amber-800 font-medium">
                          {samity.unionName}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(samity.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400 text-xs">
                <Building2 className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p>এখনও কোনো সমিতি যুক্ত করা হয়নি।</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  উপরের ফর্মে সমিতির নাম লিখে <strong>'এড করুন'</strong> এ চাপুন।
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (OK / Complete) */}
        <div className="bg-stone-50 px-5 py-3.5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {samityList.length === 0 ? (
              <span className="text-xs text-amber-900 font-medium">
                আপনার অধীনস্থ সমিতিগুলো একে একে উপরের ফর্মে লিখে এড করুন।
              </span>
            ) : (
              <span className="text-xs text-stone-600">
                ✓ {toBengaliNumber(samityList.length)}টি সমিতি প্রস্তুত। 'ওকে' চাপলেই ভ্রমণ তালিকায় বণ্টন হবে।
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleFinish}
            disabled={samityList.length === 0}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>ওকে (সম্পন্ন করুন)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

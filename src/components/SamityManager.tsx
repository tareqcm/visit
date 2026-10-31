import React, { useState } from 'react';
import { Samity } from '../types';
import { Plus, Trash2, Edit2, Check, X, Building2, MapPin, Shuffle, RotateCcw } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { DEFAULT_SAMITIES, RANGUNIA_UNIONS } from '../utils/initialData';

interface SamityManagerProps {
  samities: Samity[];
  onUpdateSamities: (samities: Samity[]) => void;
  onRedistribute: () => void;
  onOpenSetupWizard?: () => void;
}

const STORAGE_DEFAULT_UNION = 'vromon_selected_default_union';

/**
 * Automatically appends "গ্রাম উন্নয়ন সমিতি" if not already present,
 * preventing any duplication.
 */
export const formatSamityNameWithSuffix = (name: string): string => {
  let cleaned = name.trim();
  if (!cleaned) return '';
  cleaned = cleaned
    .replace(/\s*গ্রাম\s*উন্নয়ন\s*সমিতি$/g, '')
    .replace(/\s*গ্রাম\s*উন্নয়ন\s*সমিতি$/g, '')
    .replace(/\s*গ্রাম\s*উন্নয়ন$/g, '')
    .replace(/\s*গ্রাম\s*উন্নয়ন$/g, '')
    .replace(/\s*সমিতি$/g, '')
    .trim();
  return `${cleaned} গ্রাম উন্নয়ন সমিতি`;
};

export const SamityManager: React.FC<SamityManagerProps> = ({
  samities,
  onUpdateSamities,
  onRedistribute,
  onOpenSetupWizard,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSamityName, setNewSamityName] = useState('');
  
  // Persistent default union selection as requested:
  // "সমিতির নাম লিখার সময় এক বার যে ইউনিয়নের নাম সিলেক্ট করবে ঐটি ডিফল্ড ভাবে থেকে যাবে। যতক্ষণ না নিজে আমি পরিবতন না করি।"
  const [newUnionName, setNewUnionName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DEFAULT_UNION);
      return saved || '১৩নং ইসলামপুর';
    } catch {
      return '১৩নং ইসলামপুর';
    }
  });
  const [isCustomUnion, setIsCustomUnion] = useState(false);
  const [customUnionText, setCustomUnionText] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnion, setEditUnion] = useState('');
  const [isEditCustomUnion, setIsEditCustomUnion] = useState(false);

  const activeCount = samities.filter((s) => s.active).length;

  const handleUnionChange = (selectedVal: string) => {
    if (selectedVal === '__CUSTOM__') {
      setIsCustomUnion(true);
    } else {
      setIsCustomUnion(false);
      setNewUnionName(selectedVal);
      try {
        localStorage.setItem(STORAGE_DEFAULT_UNION, selectedVal);
      } catch (e) {
        console.warn('Failed to save default union', e);
      }
    }
  };

  const handleCustomUnionBlur = () => {
    if (customUnionText.trim()) {
      setNewUnionName(customUnionText.trim());
      try {
        localStorage.setItem(STORAGE_DEFAULT_UNION, customUnionText.trim());
      } catch (e) {
        console.warn('Failed to save default union', e);
      }
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSamityName.trim()) return;

    // Automatically append "গ্রাম উন্নয়ন সমিতি"
    const finalFormattedName = formatSamityNameWithSuffix(newSamityName);
    const finalUnion = isCustomUnion ? customUnionText.trim() || newUnionName : newUnionName;

    const newSamity: Samity = {
      id: Date.now().toString(),
      name: finalFormattedName,
      unionName: finalUnion.trim() || '১৩নং ইসলামপুর',
      active: true,
    };

    onUpdateSamities([...samities, newSamity]);
    // Reset only samity name; newUnionName REMAINS unchanged as default!
    setNewSamityName('');
  };

  const handleStartEdit = (samity: Samity) => {
    setEditingId(samity.id);
    setEditName(samity.name);
    setEditUnion(samity.unionName);
    setIsEditCustomUnion(!RANGUNIA_UNIONS.includes(samity.unionName));
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    const finalEditName = formatSamityNameWithSuffix(editName);
    onUpdateSamities(
      samities.map((s) =>
        s.id === id ? { ...s, name: finalEditName, unionName: editUnion.trim() } : s
      )
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onUpdateSamities(samities.filter((s) => s.id !== id));
  };

  const handleToggleActive = (id: string) => {
    onUpdateSamities(
      samities.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleResetToDefault = () => {
    if (confirm('সমিতি তালিকা কি নমুনা ডিফল্ট তালিকায় রিসেট করতে চান?')) {
      onUpdateSamities(DEFAULT_SAMITIES);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Summary Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">সমিতি ও ইউনিয়ন ব্যবস্থাপনা</h2>
              <p className="text-xs text-stone-500">
                দায়িত্বরত সমিতি: <span className="font-bold text-amber-800 text-sm">{toBengaliNumber(activeCount)}</span> টি (মোট: {toBengaliNumber(samities.length)} টি) • বর্তমান ডিফল্ট ইউনিয়ন: <span className="font-bold text-amber-900">{newUnionName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenSetupWizard && (
              <button
                type="button"
                onClick={onOpenSetupWizard}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition shadow-2xs"
                title="একে একে সকল সমিতি ও ইউনিয়ন এন্ট্রি করুন"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>সমিতি দ্রুত এন্ট্রি</span>
              </button>
            )}
            <button
              onClick={onRedistribute}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition border border-amber-300"
              title="কর্মদিবসে সমিতিগুলোর ভ্রমণ তারিখ বণ্টন করুন"
            >
              <Shuffle className="w-3.5 h-3.5" />
              তারিখ বণ্টন করুন
            </button>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              {isAdding ? 'ফর্ম বন্ধ করুন' : 'নতুন সমিতি যোগ'}
            </button>
            <button
              onClick={handleResetToDefault}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 border border-stone-200"
              title="ডিফল্ট তালিকায় ফিরিয়ে নিন"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Samity Form */}
        {isAdding && (
          <form onSubmit={handleAdd} className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200 animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                নতুন সমিতি যোগ করুন
              </h3>
              <span className="text-[11px] text-amber-800 font-medium">
                💡 নির্বাচিত ইউনিয়নটি স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Samity Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  সমিতির নাম * <span className="text-[11px] font-normal text-amber-800">("গ্রাম উন্নয়ন সমিতি" অটো সেভ হবে)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রৈস্যাবিলি বা গুল মোহাম্মদপাড়া"
                  value={newSamityName}
                  onChange={(e) => setNewSamityName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white text-stone-900"
                />
                {newSamityName.trim() ? (
                  <div className="text-[11px] text-emerald-800 font-bold mt-1.5 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>অটো-সেভ নাম: <strong className="underline decoration-emerald-500">{formatSamityNameWithSuffix(newSamityName)}</strong></span>
                  </div>
                ) : (
                  <span className="text-[10.5px] text-stone-500 mt-1 block">
                    💡 শুধু মূল নাম লিখুন, "গ্রাম উন্নয়ন সমিতি" স্বয়ংক্রিয়ভাবে যুক্ত হয়ে সংরক্ষিত হবে।
                  </span>
                )}
              </div>

              {/* Union Dropdown with all 15 unions & 1 municipality of Rangunia */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ইউনিয়ন * <span className="text-[11px] font-normal text-amber-800">(পরিবর্তন না করা পর্যন্ত ডিফল্ট থাকবে)</span>
                </label>
                
                {!isCustomUnion ? (
                  <select
                    value={newUnionName}
                    onChange={(e) => handleUnionChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white font-bold text-stone-800 cursor-pointer"
                  >
                    {RANGUNIA_UNIONS.map((union) => (
                      <option key={union} value={union}>
                        {union}
                      </option>
                    ))}
                    <option value="__CUSTOM__">✍️ অন্যান্য (নিজে লিখুন...)</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="কাস্টম ইউনিয়ন নাম লিখুন"
                      value={customUnionText}
                      onChange={(e) => setCustomUnionText(e.target.value)}
                      onBlur={handleCustomUnionBlur}
                      className="w-full px-3 py-2 rounded-lg border border-amber-500 text-sm focus:outline-hidden bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomUnion(false)}
                      className="px-2.5 py-1 text-xs bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 shrink-0"
                    >
                      তালিকায় ফিরুন
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-stone-600 mt-1 font-medium">
                  ✓ বর্তমান ডিফল্ট ইউনিয়ন: <strong className="text-amber-900">{isCustomUnion ? (customUnionText || 'নতুন নাম') : newUnionName}</strong> (পরবর্তী প্রতিটি সমিতির জন্য এটিই থাকবে)
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-amber-200/80">
              <span className="text-xs text-stone-500 hidden sm:inline">
                নাম লিখে 'যুক্ত করুন' এ চাপুন। পরপর একাধিক সমিতি দ্রুত যোগ করতে পারবেন।
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-amber-100/50"
                >
                  সমাপ্ত
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs active:scale-95 transition"
                >
                  যুক্ত করুন
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Samity List Table / Cards */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>সমিতির তালিকা ({toBengaliNumber(samities.length)} টি)</span>
          <span className="text-[11px] text-slate-500">বণ্টন নিয়মানুযায়ী ১ম দফায় প্রতি সমিতি একবার, পরে পুনরাবৃত্তি</span>
        </div>

        <div className="divide-y divide-slate-100">
          {samities.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              কোন সমিতি যোগ করা হয়নি। উপরের বাটনে ক্লিক করে সমিতি যোগ করুন।
            </div>
          ) : (
            samities.map((samity, index) => {
              const isEditing = editingId === samity.id;

              return (
                <div
                  key={samity.id}
                  className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                    samity.active ? 'hover:bg-slate-50/80' : 'bg-slate-50/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {toBengaliNumber(index + 1)}
                    </span>

                    {isEditing ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="সমিতির নাম"
                          className="px-2.5 py-1.5 rounded-lg border border-emerald-500 text-sm focus:outline-none bg-white"
                        />

                        {!isEditCustomUnion ? (
                          <select
                            value={editUnion}
                            onChange={(e) => {
                              if (e.target.value === '__CUSTOM__') {
                                setIsEditCustomUnion(true);
                              } else {
                                setEditUnion(e.target.value);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-emerald-500 text-sm focus:outline-none bg-white font-medium"
                          >
                            {RANGUNIA_UNIONS.map((union) => (
                              <option key={union} value={union}>
                                {union}
                              </option>
                            ))}
                            <option value="__CUSTOM__">✍️ অন্যান্য (নিজে লিখুন...)</option>
                          </select>
                        ) : (
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={editUnion}
                              onChange={(e) => setEditUnion(e.target.value)}
                              placeholder="ইউনিয়নের নাম লিখুন"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-500 text-sm focus:outline-none bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditCustomUnion(false);
                                setEditUnion('১৩নং ইসলামপুর');
                              }}
                              className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 shrink-0"
                            >
                              ড্রপডাউন
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 text-sm truncate">{samity.name}</p>
                          {!samity.active && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-600 font-medium">
                              নিষ্ক্রিয়
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          ইউনিয়ন: <span className="text-slate-700 font-medium">{samity.unionName}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(samity.id)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          title="সংরক্ষণ"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                          title="বাতিল"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleActive(samity.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                            samity.active
                              ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                              : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {samity.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </button>
                        <button
                          onClick={() => handleStartEdit(samity)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(samity.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                          title="মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

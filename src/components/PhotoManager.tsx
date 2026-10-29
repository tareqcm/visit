import React, { useRef, useState } from 'react';
import { FieldPhoto } from '../types';
import {
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Camera,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import { toBengaliNumber, BENGALI_MONTHS, formatBengaliMonthYear } from '../utils/bengaliNumerals';
import { DEFAULT_PHOTOS } from '../utils/initialData';

interface PhotoManagerProps {
  photos: FieldPhoto[];
  onUpdatePhotos: (photos: FieldPhoto[]) => void;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

/**
 * Compresses and resizes an uploaded image using an offscreen canvas.
 * This guarantees fast loading, prevents browser memory overflow,
 * and ensures instant display on mobile and desktop devices.
 */
function processAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('কেবলমাত্র ছবির ফাইল (JPG, PNG, WebP) আপলোড করুন।'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Max dimension 1200px - plenty sharp for A4 3-col print while keeping size ~150KB
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to FileReader
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('ফাইল পড়া যায়নি'));
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('ছবি লোড করা যায়নি'));
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  onUpdatePhotos,
  month,
  year,
  onMonthChange,
  onYearChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setIsProcessing(true);
    setFeedbackMessage(null);

    const newlyAdded: FieldPhoto[] = [];
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingProgress(`ছবি প্রসেসিং হচ্ছে... (${toBengaliNumber(i + 1)}/${toBengaliNumber(files.length)})`);

      try {
        const compressedUrl = await processAndCompressImage(file);

        // Extract timestamp from file modified time or current time
        const fileTime = file.lastModified ? new Date(file.lastModified) : new Date();
        const y = fileTime.getFullYear();
        const m = String(fileTime.getMonth() + 1).padStart(2, '0');
        const d = String(fileTime.getDate()).padStart(2, '0');
        const h = String(fileTime.getHours()).padStart(2, '0');
        const mi = String(fileTime.getMinutes()).padStart(2, '0');
        const s = String(fileTime.getSeconds()).padStart(2, '0');
        const timestampStr = `${y}${m}${d}_${h}${mi}${s}`;

        const defaultCaption = file.name.replace(/\.[^/.]+$/, '').slice(0, 30) || `ছবি নং ${photos.length + newlyAdded.length + 1}`;

        newlyAdded.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          url: compressedUrl,
          caption: defaultCaption,
          timestamp: timestampStr,
          order: photos.length + newlyAdded.length + 1,
        });

        successCount++;
      } catch (err) {
        console.error('Failed to process image:', file.name, err);
      }
    }

    if (newlyAdded.length > 0) {
      const updatedPhotos = [...photos, ...newlyAdded];
      onUpdatePhotos(updatedPhotos);

      setFeedbackMessage({
        type: 'success',
        text: `সফলভাবে ${toBengaliNumber(successCount)}টি ছবি যুক্ত হয়েছে!`,
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
    } else {
      setFeedbackMessage({
        type: 'error',
        text: 'কোনো ছবি যুক্ত করা যায়নি। সঠিক ইমেজ ফাইল নির্বাচন করুন।',
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
    }

    setIsProcessing(false);
    setProcessingProgress('');

    // Reset inputs so user can select the same or new files again
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    onUpdatePhotos(photos.filter((p) => p.id !== id));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onUpdatePhotos(
      photos.map((p) => (p.id === id ? { ...p, caption } : p))
    );
  };

  const handleTimestampChange = (id: string, timestamp: string) => {
    onUpdatePhotos(
      photos.map((p) => (p.id === id ? { ...p, timestamp } : p))
    );
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;

    const updated = [...photos];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onUpdatePhotos(updated);
  };

  const handleResetToDefault = () => {
    if (confirm(`${formatBengaliMonthYear(month, year)} মাসের জন্য নমুনা ছবিগুলো লোড করতে চান?`)) {
      onUpdatePhotos(DEFAULT_PHOTOS);
      setFeedbackMessage({
        type: 'success',
        text: 'নমুনা ৯টি ছবি লোড করা হয়েছে!',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelection}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelection}
        className="hidden"
      />

      {/* Header Info & Month Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-amber-950">মাস ভিত্তিক ছবি আপলোড</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {formatBengaliMonthYear(month, year)}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                ভিন্ন ভিন্ন মাসের জন্য ভিন্ন ভিন্ন ছবি থাকবে। এই মাসের ছবি ২য় পৃষ্ঠায় সাজানো হবে।
              </p>
            </div>
          </div>

          {/* Month Selector & Upload Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-50/60 p-1.5 rounded-xl border border-amber-200/80">
              <Calendar className="w-4 h-4 text-amber-700 ml-1" />
              <select
                value={month}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="px-2 py-1 text-xs sm:text-sm font-semibold bg-white rounded-lg border border-amber-200 text-amber-950 focus:outline-none"
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
                className="px-2 py-1 text-xs sm:text-sm font-semibold bg-white rounded-lg border border-amber-200 text-amber-950 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {toBengaliNumber(y)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs sm:text-sm font-bold transition active:scale-95 border border-amber-200"
              title="ক্যামেরা দিয়ে ছবি তুলুন"
            >
              <Camera className="w-4 h-4 text-amber-700" />
              <span>ক্যামেরা</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 disabled:opacity-75 border border-amber-500"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{processingProgress || 'আপলোড হচ্ছে...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>ছবি আপলোড</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetToDefault}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-amber-50 border border-stone-200"
              title="নমুনা ৯টি ছবি দিয়ে পূরণ করুন"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Counter Info Banner */}
        <div className="mt-3.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{formatBengaliMonthYear(month, year)}</strong> মাসের মোট ছবি:{' '}
              <strong className="text-amber-800 font-bold">{toBengaliNumber(photos.length)} টি</strong>
              {photos.length < 9 && ' (আদর্শভাবে ৯ থেকে ১৫টি ছবি দিন)'}
              {photos.length >= 9 && photos.length <= 15 && ' (২য় পৃষ্ঠায় সুন্দরভাবে অটো সাজানো হয়েছে)'}
            </span>
          </div>
          <span className="font-semibold text-amber-900 self-end sm:self-auto">
            {toBengaliNumber(photos.length)} / ১৫ টি
          </span>
        </div>
      </div>

      {/* Upload Dropzone Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="bg-white rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50/30 p-6 sm:p-8 text-center cursor-pointer transition group shadow-xs"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition border border-amber-200">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-stone-800 group-hover:text-amber-900 transition">
          {formatBengaliMonthYear(month, year)} মাসের ছবি আপলোড করতে এখানে ক্লিক করুন
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
          গ্যালারি বা ফাইল থেকে এক বা একাধিক ছবি নির্বাচন করুন (JPG, PNG)। ছবি স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হয়ে তৎক্ষণাৎ যুক্ত হবে।
        </p>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              {/* Top Bar with Number & Controls */}
              <div className="p-2.5 bg-amber-50/40 border-b border-amber-100/80 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                  ছবি নং {toBengaliNumber(index + 1)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => movePhoto(index, 'up')}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                    title="আগে নিন"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === photos.length - 1}
                    onClick={() => movePhoto(index, 'down')}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                    title="পরে নিন"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    className="p-1 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                    title="মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Photo Thumbnail */}
              <div className="aspect-4/3 w-full bg-stone-100 relative overflow-hidden group">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* Editable Caption and Timestamp */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between bg-white text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 mb-0.5">টাইমস্ট্যাম্প / কোড:</label>
                  <input
                    type="text"
                    value={photo.timestamp}
                    onChange={(e) => handleTimestampChange(photo.id, e.target.value)}
                    placeholder="20240817_125242"
                    className="w-full px-2 py-1 rounded-md border border-stone-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 mb-0.5">ক্যাপশন / বিবরণ:</label>
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    placeholder="মাঠ পরিদর্শন ছবি"
                    className="w-full px-2 py-1 rounded-md border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, Upload, Edit3, Image as ImageIcon } from 'lucide-react';
import { DEFAULT_SIGNATURE_SVG } from '../utils/initialData';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSignature: string;
  onSave: (signatureDataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  currentSignature,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [activeMode, setActiveMode] = useState<'draw' | 'upload' | 'preset'>('draw');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
    }
  }, [isOpen, activeMode]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (activeMode === 'preset') {
      onSave(DEFAULT_SIGNATURE_SVG);
    } else if (activeMode === 'upload' && uploadedPreview) {
      onSave(uploadedPreview);
    } else if (activeMode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        onSave(canvas.toDataURL('image/png'));
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5 text-slate-800 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <h3 className="font-bold text-lg text-amber-950 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-700" />
            স্বাক্ষর সেট করুন
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-amber-50/70 border border-amber-200/60 p-1 mt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveMode('draw')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeMode === 'draw' ? 'bg-white text-amber-950 shadow-xs border border-amber-200 font-bold' : 'text-stone-600 hover:text-amber-950'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            হাত দিয়ে আঁকুন
          </button>
          <button
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeMode === 'upload' ? 'bg-white text-amber-950 shadow-xs border border-amber-200 font-bold' : 'text-stone-600 hover:text-amber-950'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            ছবি আপলোড
          </button>
          <button
            onClick={() => setActiveMode('preset')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeMode === 'preset' ? 'bg-white text-amber-950 shadow-xs border border-amber-200 font-bold' : 'text-stone-600 hover:text-amber-950'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            ডিফল্ট স্বাক্ষর
          </button>
        </div>

        {/* Mode 1: Hand-draw Canvas */}
        {activeMode === 'draw' && (
          <div className="mt-4">
            <p className="text-xs text-stone-500 mb-2">নিচের বক্সে আঙুল বা মাউস দিয়ে আপনার স্বাক্ষর আঁকুন:</p>
            <div className="border-2 border-dashed border-amber-300 rounded-xl bg-stone-50 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 touch-none cursor-crosshair bg-white"
              />
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-xs text-stone-700 shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  মুছুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Upload File */}
        {activeMode === 'upload' && (
          <div className="mt-4">
            <p className="text-xs text-stone-500 mb-2">আপনার স্বাক্ষরের ছবি নির্বাচন করুন (PNG/JPG):</p>
            <label className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-amber-50/20 transition group">
              <Upload className="w-8 h-8 text-amber-600 group-hover:text-amber-700 mb-2 transition" />
              <span className="text-sm font-medium text-stone-700 group-hover:text-amber-900">ফাইল নির্বাচন করুন</span>
              <span className="text-[11px] text-stone-400 mt-1">স্বচ্ছ বা সাদা ব্যাকগ্রাউন্ডের ছবি সেরা</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {uploadedPreview && (
              <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col items-center">
                <p className="text-xs font-semibold text-stone-600 mb-1">প্রিভিউ:</p>
                <img src={uploadedPreview} alt="Signature Preview" className="max-h-20 object-contain" />
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Preset Signature */}
        {activeMode === 'preset' && (
          <div className="mt-4 p-4 border border-amber-300 rounded-xl bg-amber-50/50 flex flex-col items-center">
            <p className="text-xs text-amber-900 font-semibold mb-2">নমুনা ডকুমেন্টের প্রমাণিক স্বাক্ষর:</p>
            <div className="p-3 bg-white rounded-lg border border-amber-200 w-full flex items-center justify-center">
              <img src={DEFAULT_SIGNATURE_SVG} alt="Default Signature" className="h-14 object-contain" />
            </div>
            <p className="text-[11px] text-amber-700 mt-2">এটি নমুনার হুবহু স্বাক্ষর হিসেবে সেট হবে।</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-amber-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-sm font-bold shadow-md transition active:scale-95 border border-amber-500"
          >
            <Check className="w-4 h-4" />
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

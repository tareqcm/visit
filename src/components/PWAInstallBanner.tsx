import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  // If not installable and not iOS, don't render anything
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Discreet, elegant floating install button that never overlaps header */}
      <div className="fixed bottom-18 right-3 sm:bottom-6 sm:right-6 z-40 no-print animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-amber-300">
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>অ্যাপ ইনস্টল</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition active:scale-95 border border-amber-200"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-700" />
              <span>আইফোনে ইনস্টল</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            aria-label="Close"
            className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-stone-800 animate-in fade-in zoom-in-95 border border-amber-200">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h3 className="font-bold text-base text-amber-950 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-600" />
                আইফোনে অ্যাপ ইনস্টল নির্দেশিকা
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm text-stone-700">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-950 flex items-center justify-center font-bold text-xs shrink-0">
                  ১
                </div>
                <div>
                  Safari ব্রাউজারের নিচের <Share2 className="inline w-4 h-4 mx-1 text-blue-600" /> <strong>Share</strong> আইকনে চাপ দিন।
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-950 flex items-center justify-center font-bold text-xs shrink-0">
                  ২
                </div>
                <div>
                  একটু নিচে স্ক্রল করে <PlusSquare className="inline w-4 h-4 mx-1 text-stone-700" /> <strong>Add to Home Screen</strong> এ চাপ দিন।
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-950 flex items-center justify-center font-bold text-xs shrink-0">
                  ৩
                </div>
                <div>
                  উপরে ডানপাশে <strong>Add</strong> বাটনে ট্যাপ করলেই অ্যাপটি হোম স্ক্রিনে ইনস্টল হয়ে যাবে।
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 shadow-sm transition"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
};

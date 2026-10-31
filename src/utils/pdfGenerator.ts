import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export async function downloadReportPDF(
  page1ElementId: string,
  page2ElementId: string,
  fileName: string = 'ভ্রমণ_বিবরণী.pdf',
  onProgress?: (progressText: string) => void
): Promise<void> {
  const page1 = document.getElementById(page1ElementId);
  const page2 = document.getElementById(page2ElementId);

  if (!page1 || !page2) {
    throw new Error('পৃষ্ঠা খুঁজে পাওয়া যায়নি। অনুগ্রহ করে প্রিভিউ চেক করুন।');
  }

  // 1. Wait until all fonts (Hind Siliguri, Noto Sans Bengali) are 100% loaded
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // 2. Temporarily disable any CSS zoom/transform (scale) on the parent container
  // This completely eliminates the html2canvas text kerning/overlap bug where letters smash together
  const zoomWrapper = (page1.closest('[style*="transform"]') || page1.parentElement) as HTMLElement | null;
  const originalTransform = zoomWrapper ? zoomWrapper.style.transform : '';
  const originalTransition = zoomWrapper ? zoomWrapper.style.transition : '';

  try {
    if (zoomWrapper) {
      zoomWrapper.style.transition = 'none';
      zoomWrapper.style.transform = 'none';
    }

    // Allow DOM to settle with transform: none
    await new Promise((resolve) => setTimeout(resolve, 60));

    onProgress?.('১ম পৃষ্ঠা প্রক্রিয়াকরণ হচ্ছে...');

    const canvasOptions = {
      scale: 2, // High resolution for crisp, professional printing
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      letterRendering: false,
      onclone: (clonedDoc: Document) => {
        // Enforce clean letter spacing and unscaled rendering in cloned DOM
        const clonedP1 = clonedDoc.getElementById(page1ElementId);
        const clonedP2 = clonedDoc.getElementById(page2ElementId);
        [clonedP1, clonedP2].forEach((p) => {
          if (p) {
            p.style.transform = 'none';
            p.style.letterSpacing = 'normal';
            p.style.wordSpacing = 'normal';
            p.querySelectorAll<HTMLElement>('*').forEach((el) => {
              el.style.letterSpacing = 'normal';
            });
          }
        });
      },
    };

    // Capture Page 1
    const canvas1 = await html2canvas(page1, canvasOptions);
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);

    onProgress?.('২য় পৃষ্ঠা প্রক্রিয়াকরণ হচ্ছে...');

    // Capture Page 2
    const canvas2 = await html2canvas(page2, canvasOptions);
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);

    onProgress?.('২ পৃষ্ঠার পিডিএফ ফাইল তৈরি হচ্ছে...');

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Page 1
    pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    // Page 2
    pdf.addPage();
    pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    onProgress?.('পিডিএফ ডাউনলোড হচ্ছে...');
    pdf.save(fileName);
  } finally {
    // Restore original transform/zoom level seamlessly
    if (zoomWrapper) {
      zoomWrapper.style.transform = originalTransform;
      zoomWrapper.style.transition = originalTransition;
    }
  }
}

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

  onProgress?.('১ম পৃষ্ঠা তৈরি হচ্ছে...');

  // Capture Page 1 using html2canvas-pro (native OKLch & modern CSS support)
  const canvas1 = await html2canvas(page1, {
    scale: 2, // High resolution for crisp printing
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
  const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);

  onProgress?.('২য় পৃষ্ঠা তৈরি হচ্ছে...');

  // Capture Page 2 using html2canvas-pro
  const canvas2 = await html2canvas(page2, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
  const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);

  onProgress?.('২ পৃষ্ঠার পিডিএফ তৈরি হচ্ছে...');

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

  onProgress?.('ডাউনলোড শুরু হচ্ছে...');
  pdf.save(fileName);
}

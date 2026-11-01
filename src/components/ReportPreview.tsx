import React from 'react';
import { OfficerInfo, WorkingDay, FieldPhoto } from '../types';
import { toBengaliNumber, formatBengaliMonthYear, formatBengaliDate } from '../utils/bengaliNumerals';
import { DEFAULT_PHOTOS } from '../utils/initialData';
import { FileText, Camera } from 'lucide-react';

interface ReportPreviewProps {
  officerInfo: OfficerInfo;
  workingDays: WorkingDay[]; // Only working days for table
  photos: FieldPhoto[];
  signatureUrl: string;
}

export function formatBranchAndDistrict(branch?: string, district?: string): string {
  const b = (branch || '').trim();
  const d = (district || '').trim();
  if (b && d) {
    if (b.includes(d)) {
      return b.endsWith('।') ? b : `${b}।`;
    }
    return `${b}, ${d}।`;
  }
  if (b) return b.endsWith('।') ? b : `${b}।`;
  if (d) return `${d}।`;
  return 'রাঙ্গুনিয়া শাখা, চট্টগ্রাম।';
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  officerInfo,
  workingDays,
  photos,
  signatureUrl,
}) => {
  const monthYearStr = formatBengaliMonthYear(officerInfo.month, officerInfo.year);
  const totalVisitsCount = workingDays.length;

  // ================= 1. DYNAMIC PAGE 1 ROW HEIGHT & SPAN CALCULATION =================
  // Guarantees that Page 1 table COMPLETELY FILLS the entire A4 page vertically
  // whether there are 22 days, 20 days, or 15 days, with ZERO blank empty void!
  const rowsCount = Math.max(1, totalVisitsCount);
  // Total available vertical height reserved for table rows is ~760px
  // (297mm A4 = ~1122px - ~20mm padding - ~170px headers & statement - ~85px signature)
  const targetRowHeightPx = Math.min(56, Math.max(30, Math.floor(755 / rowsCount)));

  // Responsive font sizes and paddings
  const isDense = rowsCount >= 22;
  const tableHeaderFontSize = isDense ? '13px' : '13.5px';
  const tableRowFontSize = isDense ? '12.5px' : '13px';

  // ================= 2. ADAPTIVE PAGE 2 PHOTO GRID =================
  // If user has not uploaded photos for this month, default to official template photos so Page 2 is NEVER empty
  const activePhotos = (photos && photos.length > 0) ? photos : DEFAULT_PHOTOS;
  const displayedPhotos = activePhotos.slice(0, 15);
  const photoCount = displayedPhotos.length;

  let gridColsClass = 'grid-cols-3';
  let photoHeightPx = 205;
  let captionHeightPx = 28;
  let captionFontSize = '12.5px';
  let gridGapPx = 10;

  if (photoCount <= 2) {
    gridColsClass = 'grid-cols-2';
    photoHeightPx = 360;
    captionHeightPx = 34;
    captionFontSize = '14px';
    gridGapPx = 14;
  } else if (photoCount <= 4) {
    gridColsClass = 'grid-cols-2';
    photoHeightPx = 295;
    captionHeightPx = 32;
    captionFontSize = '13.5px';
    gridGapPx = 12;
  } else if (photoCount <= 6) {
    gridColsClass = 'grid-cols-3';
    photoHeightPx = 280;
    captionHeightPx = 30;
    captionFontSize = '13px';
    gridGapPx = 11;
  } else if (photoCount <= 9) {
    // Standard 7-9 photos (3 rows x 3 cols) - Fills Page 2 completely
    gridColsClass = 'grid-cols-3';
    photoHeightPx = 205;
    captionHeightPx = 28;
    captionFontSize = '12.5px';
    gridGapPx = 10;
  } else if (photoCount <= 12) {
    // 10-12 photos (4 rows x 3 cols)
    gridColsClass = 'grid-cols-3';
    photoHeightPx = 145;
    captionHeightPx = 25;
    captionFontSize = '12px';
    gridGapPx = 8;
  } else {
    // 13-15 photos (5 rows x 3 cols)
    gridColsClass = 'grid-cols-3';
    photoHeightPx = 112;
    captionHeightPx = 22;
    captionFontSize = '11.5px';
    gridGapPx = 7;
  }

  // Classic high-contrast Bengali serif font stack for crystal clear printing
  const standardBengaliFont = "'Noto Serif Bengali', 'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', serif";

  return (
    <div className="flex flex-col items-center gap-6 print-page-container">
      {/* ================= PAGE 1 ================= */}
      <div className="w-full flex flex-col items-center">
        {/* Page 1 Header Indicator Badge (HTML View Only) */}
        <div className="no-print flex items-center justify-between w-full max-w-[210mm] px-2 text-xs text-stone-600 font-semibold mb-2">
          <span className="flex items-center gap-1.5 text-amber-900 bg-amber-100/90 px-3 py-1 rounded-lg border border-amber-300 shadow-2xs font-bold">
            <FileText className="w-3.5 h-3.5 text-amber-800" />
            পৃষ্ঠা ১ এর ২: ভ্রমণ বিবরণী ছক ও স্বাক্ষর
          </span>
          <span className="text-[11px] bg-white border border-stone-200 px-2.5 py-0.5 rounded-md text-stone-500 shadow-2xs">
            {toBengaliNumber(totalVisitsCount)}টি কর্মদিবস • সম্পূর্ণ পেজ-ফিট এ৪ সাইজ (210 × 297 মিমি)
          </span>
        </div>

        <div
          id="pdf-page-1"
          className="a4-page mx-auto flex flex-col justify-between"
          style={{
            width: '210mm',
            height: '297mm',
            minHeight: '297mm',
            maxHeight: '297mm',
            padding: '9mm 14mm 8mm 14mm',
            boxSizing: 'border-box',
            position: 'relative',
            backgroundColor: '#ffffff',
            color: '#000000',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            fontFamily: standardBengaliFont,
            letterSpacing: 'normal',
            wordSpacing: 'normal',
            overflow: 'hidden',
          }}
        >
          {/* Top Section: Bank Header + Certification Statement */}
          <div className="shrink-0">
            {/* Top Bank Header */}
            <div className="text-center" style={{ color: '#000000' }}>
              <h1
                className="font-black leading-tight text-black"
                style={{
                  fontSize: '25px',
                  color: '#000000',
                  fontFamily: standardBengaliFont,
                  letterSpacing: '0.01em',
                  fontWeight: 900,
                }}
              >
                {officerInfo.bankName || 'পল্লী সঞ্চয় ব্যাংক'}
              </h1>
              <h2
                className="font-bold text-black"
                style={{
                  fontSize: '16px',
                  marginTop: '2px',
                  color: '#000000',
                  fontFamily: standardBengaliFont,
                  letterSpacing: '0.01em',
                  fontWeight: 700,
                }}
              >
                {formatBranchAndDistrict(officerInfo.branchName, officerInfo.districtName)}
              </h2>
              <div style={{ marginTop: '3px' }}>
                <span
                  className="font-black underline decoration-2 underline-offset-4 text-black"
                  style={{
                    fontSize: '19.5px',
                    color: '#000000',
                    fontFamily: standardBengaliFont,
                    letterSpacing: '0.01em',
                    fontWeight: 900,
                  }}
                >
                  ভ্রমণ বিবরণী
                </span>
              </div>
            </div>

            {/* Certificate statement */}
            <div
              className="text-justify font-bold text-black"
              style={{
                marginTop: '10px',
                fontSize: '14px',
                lineHeight: '1.7',
                color: '#000000',
                fontFamily: standardBengaliFont,
                letterSpacing: '0.01em',
                wordSpacing: 'normal',
                fontWeight: 700,
              }}
            >
              এ মর্মে প্রত্যয়ন করা যাচ্ছে যে, স্মারক নং- {officerInfo.smarokNo}, তারিখ- {officerInfo.smarokDate} খ্রিঃ এর বর্ননা অনুসারে {monthYearStr} মাসে{' '}
              <span className="font-black underline">{toBengaliNumber(totalVisitsCount)}</span> টি মাঠ পরিদর্শন এর তালিকা।
              <div className="font-black" style={{ marginTop: '2px' }}>নিম্নরুপঃ</div>
            </div>
          </div>

          {/* Middle Section: Table that FILLS the entire available space down to the signature */}
          <div className="flex-1 flex flex-col justify-start my-1.5 w-full min-h-0">
            <table
              className="w-full h-full text-center"
              style={{
                height: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                color: '#000000',
                backgroundColor: '#ffffff',
                fontFamily: standardBengaliFont,
                letterSpacing: 'normal',
              }}
            >
              <thead>
                <tr style={{ height: '36px', minHeight: '36px', border: '1.5px solid #000000', backgroundColor: '#f8fafc' }}>
                  <th
                    className="px-1 font-black w-[7%]"
                    style={{
                      fontSize: tableHeaderFontSize,
                      border: '1.2px solid #000000',
                      color: '#000000',
                    }}
                  >
                    ক্রমিক নং
                  </th>
                  <th
                    className="px-1 font-black w-[17%]"
                    style={{
                      fontSize: tableHeaderFontSize,
                      border: '1.2px solid #000000',
                      color: '#000000',
                    }}
                  >
                    ভ্রমণের তারিখ
                  </th>
                  <th
                    className="px-1 font-black w-[15%]"
                    style={{
                      fontSize: tableHeaderFontSize,
                      border: '1.2px solid #000000',
                      color: '#000000',
                    }}
                  >
                    শাখার নাম
                  </th>
                  <th
                    className="px-1 font-black w-[22%]"
                    style={{
                      fontSize: tableHeaderFontSize,
                      border: '1.2px solid #000000',
                      color: '#000000',
                    }}
                  >
                    ইউনিয়নের নাম
                  </th>
                  <th
                    className="px-1 font-black w-[29%]"
                    style={{
                      fontSize: tableHeaderFontSize,
                      border: '1.2px solid #000000',
                      color: '#000000',
                    }}
                  >
                    সমিতির নাম
                  </th>
                  <th
                    className="px-1 font-black w-[10%]"
                    style={{
                      fontSize: tableHeaderFontSize,
                      border: '1.2px solid #000000',
                      color: '#000000',
                    }}
                  >
                    মন্তব্য
                  </th>
                </tr>
              </thead>
              <tbody>
                {workingDays.length === 0 ? (
                  <tr style={{ height: '180px', border: '1.2px solid #000000' }}>
                    <td
                      colSpan={6}
                      className="px-4 py-8 font-bold text-stone-500 text-center align-middle"
                      style={{
                        fontSize: '14px',
                        border: '1.2px solid #000000',
                        color: '#475569',
                      }}
                    >
                      এই মাসে কোনো কর্মদিবস বা মাঠ পরিদর্শন নির্ধারিত নেই।
                    </td>
                  </tr>
                ) : (
                  workingDays.map((day, idx) => (
                  <tr
                    key={day.date}
                    style={{
                      height: `${targetRowHeightPx}px`,
                      border: '1.2px solid #000000',
                    }}
                  >
                    <td
                      className="px-1 font-black text-black leading-tight align-middle"
                      style={{
                        fontSize: tableRowFontSize,
                        border: '1.2px solid #000000',
                        color: '#000000',
                      }}
                    >
                      {toBengaliNumber(idx + 1)}
                    </td>
                    <td
                      className="px-1 font-bold text-black leading-tight whitespace-nowrap align-middle"
                      style={{
                        fontSize: tableRowFontSize,
                        border: '1.2px solid #000000',
                        color: '#000000',
                      }}
                    >
                      {formatBengaliDate(day.date)}
                    </td>
                    <td
                      className="px-1 font-bold text-black leading-tight align-middle"
                      style={{
                        fontSize: tableRowFontSize,
                        border: '1.2px solid #000000',
                        color: '#000000',
                      }}
                    >
                      {day.branchName || 'রাঙ্গুনিয়া'}
                    </td>
                    <td
                      className="px-1 font-bold text-black leading-tight align-middle"
                      style={{
                        fontSize: tableRowFontSize,
                        border: '1.2px solid #000000',
                        color: '#000000',
                      }}
                    >
                      {day.unionName || '১৩নং ইসলামপুর'}
                    </td>
                    <td
                      className="px-1 font-bold text-black leading-tight text-center align-middle"
                      style={{
                        fontSize: tableRowFontSize,
                        border: '1.2px solid #000000',
                        color: '#000000',
                      }}
                    >
                      {day.samityName || '-'}
                    </td>
                    <td
                      className="px-1 font-bold text-black leading-tight align-middle"
                      style={{
                        fontSize: tableRowFontSize,
                        border: '1.2px solid #000000',
                        color: '#000000',
                      }}
                    >
                      {day.remarks || ''}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Section: Footer Signature (Pinned just below the table at the page base) */}
          <div className="shrink-0 flex justify-end mt-1">
            <div className="w-56 flex flex-col items-center text-center">
              {/* Signature image container */}
              <div
                className="w-44 flex items-end justify-center mb-0.5"
                style={{ height: '38px' }}
              >
                <img
                  src={signatureUrl}
                  alt="Signature"
                  className="max-h-full max-w-full object-contain filter contrast-125"
                />
              </div>
              {/* Signature line */}
              <div className="w-48 my-0.5" style={{ borderTop: '1.5px solid #000000' }}></div>
              <div
                className="font-black leading-tight text-black"
                style={{
                  fontSize: '13.5px',
                  color: '#000000',
                  fontFamily: standardBengaliFont,
                }}
              >
                স্বাক্ষর ও তারিখ
              </div>
              <div
                className="font-black leading-tight mt-0.5 text-black"
                style={{
                  fontSize: '13.5px',
                  color: '#000000',
                  fontFamily: standardBengaliFont,
                }}
              >
                {officerInfo.designation || 'মাঠ সহকারী'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="w-full flex flex-col items-center">
        {/* Page 2 Header Indicator Badge (HTML View Only) */}
        <div className="no-print flex items-center justify-between w-full max-w-[210mm] px-2 text-xs text-stone-600 font-semibold mb-2 mt-4">
          <span className="flex items-center gap-1.5 text-amber-900 bg-amber-100/90 px-3 py-1 rounded-lg border border-amber-300 shadow-2xs font-bold">
            <Camera className="w-3.5 h-3.5 text-amber-800" />
            পৃষ্ঠা ২ এর ২: মাঠ পরিদর্শন ও সমিতি কার্যক্রমের স্থিরচিত্র
          </span>
          <span className="text-[11px] bg-white border border-stone-200 px-2.5 py-0.5 rounded-md text-stone-500 shadow-2xs">
            {toBengaliNumber(displayedPhotos.length > 0 ? displayedPhotos.length : 4)}টি ছবি ফ্রেম • সম্পূর্ণ পেজ-ফিট এ৪ সাইজ (210 × 297 মিমি)
          </span>
        </div>

        <div
          id="pdf-page-2"
          className="a4-page mx-auto flex flex-col justify-between"
          style={{
            width: '210mm',
            height: '297mm',
            minHeight: '297mm',
            maxHeight: '297mm',
            padding: '9mm 14mm 8mm 14mm',
            boxSizing: 'border-box',
            position: 'relative',
            backgroundColor: '#ffffff',
            color: '#000000',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            fontFamily: standardBengaliFont,
            letterSpacing: 'normal',
            wordSpacing: 'normal',
            overflow: 'hidden',
          }}
        >
          {/* Top Section */}
          <div className="shrink-0">
            <div className="text-center" style={{ color: '#000000' }}>
              <h1
                className="font-black leading-tight text-black"
                style={{
                  fontSize: '25px',
                  color: '#000000',
                  fontFamily: standardBengaliFont,
                  letterSpacing: '0.01em',
                  fontWeight: 900,
                }}
              >
                {officerInfo.bankName || 'পল্লী সঞ্চয় ব্যাংক'}
              </h1>
              <h2
                className="font-bold text-black"
                style={{
                  fontSize: '16px',
                  marginTop: '2px',
                  color: '#000000',
                  fontFamily: standardBengaliFont,
                  letterSpacing: '0.01em',
                  fontWeight: 700,
                }}
              >
                {formatBranchAndDistrict(officerInfo.branchName, officerInfo.districtName)}
              </h2>
              <div style={{ marginTop: '3px' }}>
                <span
                  className="font-black underline decoration-2 underline-offset-4 text-black"
                  style={{
                    fontSize: '19.5px',
                    color: '#000000',
                    fontFamily: standardBengaliFont,
                    letterSpacing: '0.01em',
                    fontWeight: 900,
                  }}
                >
                  মাঠ পরিদর্শন ও সমিতি কার্যক্রমের স্থিরচিত্র
                </span>
              </div>
            </div>

            {/* Subheader info bar */}
            <div
              className="flex items-center justify-between font-black pb-1 text-black"
              style={{
                marginTop: '12px',
                fontSize: '14px',
                color: '#000000',
                fontFamily: standardBengaliFont,
                letterSpacing: '0.01em',
              }}
            >
              <div>মাস: {monthYearStr}</div>
              <div>স্মারক নং: {officerInfo.smarokNo}</div>
              <div>মোট ছবি: {toBengaliNumber(displayedPhotos.length)} টি</div>
            </div>
          </div>

          {/* Middle Section: Photo Grid that FILLS Page 2 vertically */}
          <div className="flex-1 flex flex-col justify-start my-1.5 w-full min-h-0">
            {displayedPhotos.length > 0 ? (
              <div
                className={`grid ${gridColsClass}`}
                style={{ gap: `${gridGapPx}px` }}
              >
                {displayedPhotos.map((photo, index) => (
                  <div
                    key={photo.id || index}
                    className="flex flex-col overflow-hidden"
                    style={{
                      border: '1.5px solid #000000',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div
                      className="w-full flex items-center justify-center overflow-hidden"
                      style={{
                        height: `${photoHeightPx}px`,
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div
                      className="px-1 flex items-center justify-center text-center"
                      style={{
                        height: `${captionHeightPx}px`,
                        borderTop: '1.5px solid #000000',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <span
                        className="font-bold leading-none block truncate text-black"
                        style={{
                          fontSize: captionFontSize,
                          color: '#000000',
                          fontFamily: standardBengaliFont,
                          letterSpacing: '0.01em',
                          fontWeight: 700,
                        }}
                      >
                        ছবি নং {toBengaliNumber(index + 1)}: {photo.timestamp || photo.caption}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback structured grid if 0 photos: fills Page 2 completely so it's NEVER empty */
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  'মাঠ পরিদর্শন ও ঋণ বিতরণ সভা',
                  'সঞ্চয় আদায় ও সমিতি বৈঠক',
                  'উঠান বৈঠক ও ঋণ তদারকি',
                  'সমিতি কার্যবিবরণী ও হিসাব নিরীক্ষা',
                ].map((caption, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col overflow-hidden border-2 border-dashed border-stone-300 bg-stone-50/50 rounded"
                    style={{ height: '240px' }}
                  >
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                      <Camera className="w-8 h-8 text-stone-400 mb-2" />
                      <span className="text-xs font-bold text-stone-600">
                        স্থিরচিত্র ফ্রেম #{toBengaliNumber(idx + 1)}
                      </span>
                      <span className="text-[11px] text-stone-400 mt-0.5">
                        {caption}
                      </span>
                    </div>
                    <div className="h-8 bg-stone-100 border-t border-dashed border-stone-300 flex items-center justify-center px-2">
                      <span className="text-xs font-bold text-stone-700 truncate">
                        ছবি নং {toBengaliNumber(idx + 1)}: {caption}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Section: Page 2 Footer & Signature */}
          <div className="shrink-0 mt-1">
            {/* Divider line */}
            <div className="w-full mb-1.5" style={{ borderTop: '1px solid #cbd5e1' }}></div>

            <div className="flex items-end justify-between">
              {/* Left Disclaimer Note */}
              <div
                className="text-[12px] font-bold italic text-black"
                style={{
                  color: '#000000',
                  fontFamily: standardBengaliFont,
                  letterSpacing: '0.01em',
                }}
              >
                * মাঠ পরিদর্শন ও আদায় কার্যক্রমের প্রমাণক হিসেবে সংরক্ষিত
              </div>

              {/* Right Signature */}
              <div className="w-56 flex flex-col items-center text-center">
                <div className="h-9 w-44 flex items-end justify-center mb-0.5">
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain filter contrast-125"
                  />
                </div>
                <div className="w-48 my-0.5" style={{ borderTop: '1.5px solid #000000' }}></div>
                <div
                  className="text-[13.5px] font-black leading-tight text-black"
                  style={{ color: '#000000', fontFamily: standardBengaliFont }}
                >
                  স্বাক্ষর ও তারিখ
                </div>
                <div
                  className="text-[13.5px] font-black leading-tight mt-0.5 text-black"
                  style={{ color: '#000000', fontFamily: standardBengaliFont }}
                >
                  {officerInfo.designation || 'মাঠ সহকারী'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { OfficerInfo, WorkingDay, FieldPhoto } from '../types';
import { toBengaliNumber, formatBengaliMonthYear, formatBengaliDate } from '../utils/bengaliNumerals';

interface ReportPreviewProps {
  officerInfo: OfficerInfo;
  workingDays: WorkingDay[]; // Only working days for table
  photos: FieldPhoto[];
  signatureUrl: string;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  officerInfo,
  workingDays,
  photos,
  signatureUrl,
}) => {
  const monthYearStr = formatBengaliMonthYear(officerInfo.month, officerInfo.year);
  const totalVisitsCount = workingDays.length;

  const displayedPhotos = photos.slice(0, 15);
  const photoCount = displayedPhotos.length;

  // Intelligent adaptive photo grid calculation to fully fill Page 2
  // Automatically scales photo height based on photo count so Page 2 is always beautifully full
  let gridColsClass = 'grid-cols-3';
  let photoHeightPx = 186; // for 9 photos (~186px photo + 28px caption)
  let captionHeightPx = 28;
  let captionFontSize = '12px';
  let gridGapPx = 10;

  if (photoCount <= 2) {
    gridColsClass = 'grid-cols-2';
    photoHeightPx = 360;
    captionHeightPx = 32;
    captionFontSize = '13.5px';
    gridGapPx = 14;
  } else if (photoCount <= 4) {
    gridColsClass = 'grid-cols-2';
    photoHeightPx = 280;
    captionHeightPx = 30;
    captionFontSize = '13px';
    gridGapPx = 12;
  } else if (photoCount <= 6) {
    gridColsClass = 'grid-cols-3';
    photoHeightPx = 270;
    captionHeightPx = 28;
    captionFontSize = '12.5px';
    gridGapPx = 11;
  } else if (photoCount <= 9) {
    // Standard 7-9 photos (3 rows x 3 cols): tall and prominent
    gridColsClass = 'grid-cols-3';
    photoHeightPx = 186;
    captionHeightPx = 27;
    captionFontSize = '12px';
    gridGapPx = 10;
  } else if (photoCount <= 12) {
    // 10-12 photos (4 rows x 3 cols)
    gridColsClass = 'grid-cols-3';
    photoHeightPx = 135;
    captionHeightPx = 25;
    captionFontSize = '11.5px';
    gridGapPx = 8;
  } else {
    // 13-15 photos (5 rows x 3 cols)
    gridColsClass = 'grid-cols-3';
    photoHeightPx = 104;
    captionHeightPx = 22;
    captionFontSize = '11px';
    gridGapPx = 7;
  }

  const standardBengaliFont = "'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Noto Sans Bengali', system-ui, serif";

  return (
    <div className="flex flex-col items-center gap-8 print-page-container">
      {/* ================= PAGE 1 ================= */}
      <div
        id="pdf-page-1"
        className="a4-page mx-auto flex flex-col justify-between"
        style={{
          width: '210mm',
          height: '297mm',
          minHeight: '297mm',
          maxHeight: '297mm',
          padding: '12mm 15mm 10mm 15mm',
          boxSizing: 'border-box',
          position: 'relative',
          backgroundColor: '#ffffff',
          color: '#000000',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          fontFamily: standardBengaliFont,
        }}
      >
        {/* Top Header */}
        <div>
          <div className="text-center" style={{ color: '#000000' }}>
            <h1
              className="text-[25px] font-bold tracking-tight leading-tight"
              style={{ color: '#000000', fontFamily: standardBengaliFont }}
            >
              {officerInfo.bankName}
            </h1>
            <h2
              className="text-[16px] font-semibold mt-0.5"
              style={{ color: '#000000', fontFamily: standardBengaliFont }}
            >
              {officerInfo.branchName}
            </h2>
            <div className="mt-1">
              <span
                className="text-[19px] font-bold underline decoration-2 underline-offset-4"
                style={{ color: '#000000', fontFamily: standardBengaliFont }}
              >
                ভ্রমণ বিবরণী
              </span>
            </div>
          </div>

          {/* Certificate statement */}
          <div
            className="mt-3.5 text-[14px] leading-[1.65] text-justify font-normal"
            style={{ color: '#000000', fontFamily: standardBengaliFont }}
          >
            এ মর্মে প্রত্যয়ন করা যাচ্ছে যে, স্মারক নং- {officerInfo.smarokNo}, তারিখ- {officerInfo.smarokDate} খ্রিঃ এর বর্ননা অনুসারে {monthYearStr} মাসে{' '}
            <span className="font-bold underline">{toBengaliNumber(totalVisitsCount)}</span> টি মাঠ পরিদর্শন এর তালিকা।
            <div className="font-bold mt-1">নিম্নরুপঃ</div>
          </div>

          {/* Table */}
          <div className="mt-2.5 w-full">
            <table
              className="w-full text-center"
              style={{
                borderCollapse: 'collapse',
                border: '1.2px solid #000000',
                color: '#000000',
                backgroundColor: '#ffffff',
                fontFamily: standardBengaliFont,
              }}
            >
              <thead>
                <tr style={{ border: '1.2px solid #000000', backgroundColor: '#ffffff' }}>
                  <th className="py-1.5 px-1 text-[13px] font-bold w-[7%]" style={{ border: '1px solid #000000' }}>
                    ক্রমিক নং
                  </th>
                  <th className="py-1.5 px-1 text-[13px] font-bold w-[17%]" style={{ border: '1px solid #000000' }}>
                    ভ্রমণের তারিখ
                  </th>
                  <th className="py-1.5 px-1 text-[13px] font-bold w-[15%]" style={{ border: '1px solid #000000' }}>
                    শাখার নাম
                  </th>
                  <th className="py-1.5 px-1 text-[13px] font-bold w-[22%]" style={{ border: '1px solid #000000' }}>
                    ইউনিয়নের নাম
                  </th>
                  <th className="py-1.5 px-1 text-[13px] font-bold w-[29%]" style={{ border: '1px solid #000000' }}>
                    সমিতির নাম
                  </th>
                  <th className="py-1.5 px-1 text-[13px] font-bold w-[10%]" style={{ border: '1px solid #000000' }}>
                    মন্তব্য
                  </th>
                </tr>
              </thead>
              <tbody>
                {workingDays.map((day, idx) => (
                  <tr key={day.date} style={{ border: '1px solid #000000' }}>
                    <td className="py-1 px-1 text-[13px] font-medium leading-tight" style={{ border: '1px solid #000000' }}>
                      {toBengaliNumber(idx + 1)}
                    </td>
                    <td className="py-1 px-1 text-[13px] font-medium leading-tight whitespace-nowrap" style={{ border: '1px solid #000000' }}>
                      {formatBengaliDate(day.date)}
                    </td>
                    <td className="py-1 px-1 text-[13px] font-medium leading-tight" style={{ border: '1px solid #000000' }}>
                      {day.branchName || 'রাঙ্গুনিয়া'}
                    </td>
                    <td className="py-1 px-1 text-[13px] font-medium leading-tight" style={{ border: '1px solid #000000' }}>
                      {day.unionName || '১৩নং ইসলামপুর'}
                    </td>
                    <td className="py-1 px-1 text-[13px] font-medium leading-tight text-center" style={{ border: '1px solid #000000' }}>
                      {day.samityName || '-'}
                    </td>
                    <td className="py-1 px-1 text-[13px] font-medium leading-tight" style={{ border: '1px solid #000000' }}>
                      {day.remarks || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Page 1 Footer Signature */}
        <div className="pt-2 flex justify-end">
          <div className="w-56 flex flex-col items-center text-center">
            {/* Signature image container */}
            <div className="h-10 w-44 flex items-end justify-center mb-0.5">
              <img
                src={signatureUrl}
                alt="Signature"
                className="max-h-full max-w-full object-contain filter contrast-125"
              />
            </div>
            {/* Signature line */}
            <div className="w-48 my-0.5" style={{ borderTop: '1px solid #000000' }}></div>
            <div className="text-[13px] font-bold leading-tight" style={{ color: '#000000', fontFamily: standardBengaliFont }}>
              স্বাক্ষর ও তারিখ
            </div>
            <div className="text-[13px] font-bold leading-tight" style={{ color: '#000000', fontFamily: standardBengaliFont }}>
              {officerInfo.designation || 'ফিল্ড অ্যাসিস্ট্যান্ট অফিসার'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div
        id="pdf-page-2"
        className="a4-page mx-auto flex flex-col justify-between"
        style={{
          width: '210mm',
          height: '297mm',
          minHeight: '297mm',
          maxHeight: '297mm',
          padding: '12mm 15mm 10mm 15mm',
          boxSizing: 'border-box',
          position: 'relative',
          backgroundColor: '#ffffff',
          color: '#000000',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          fontFamily: standardBengaliFont,
        }}
      >
        {/* Top Header */}
        <div>
          <div className="text-center" style={{ color: '#000000' }}>
            <h1
              className="text-[25px] font-bold tracking-tight leading-tight"
              style={{ color: '#000000', fontFamily: standardBengaliFont }}
            >
              {officerInfo.bankName}
            </h1>
            <h2
              className="text-[16px] font-semibold mt-0.5"
              style={{ color: '#000000', fontFamily: standardBengaliFont }}
            >
              {officerInfo.branchName}
            </h2>
            <div className="mt-1">
              <span
                className="text-[19px] font-bold underline decoration-2 underline-offset-4"
                style={{ color: '#000000', fontFamily: standardBengaliFont }}
              >
                মাঠ পরিদর্শন ও সমিতি কার্যক্রমের স্থিরচিত্র
              </span>
            </div>
          </div>

          {/* Subheader info bar */}
          <div
            className="mt-3 flex items-center justify-between text-[13.5px] font-bold pb-1"
            style={{ color: '#000000', fontFamily: standardBengaliFont }}
          >
            <div>মাস: {monthYearStr}</div>
            <div>স্মারক নং: {officerInfo.smarokNo}</div>
            <div>মোট ছবি: {toBengaliNumber(displayedPhotos.length)} টি</div>
          </div>

          {/* Photos Grid matching sample image 2 with auto-filling height */}
          <div
            className={`mt-2.5 grid ${gridColsClass}`}
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
                {/* Photo frame with expanded height to fill the page */}
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
                {/* Photo caption box below */}
                <div
                  className="px-1 flex items-center justify-center text-center"
                  style={{
                    height: `${captionHeightPx}px`,
                    borderTop: '1.5px solid #000000',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <span
                    className="font-bold tracking-tight leading-none block truncate"
                    style={{
                      fontSize: captionFontSize,
                      color: '#000000',
                      fontFamily: standardBengaliFont,
                    }}
                  >
                    ছবি নং {toBengaliNumber(index + 1)}: {photo.timestamp || photo.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Page 2 Bottom Footer & Signature */}
        <div>
          {/* Divider line */}
          <div className="w-full mb-3" style={{ borderTop: '1px solid #cbd5e1' }}></div>

          <div className="flex items-end justify-between">
            {/* Left Disclaimer Note */}
            <div
              className="text-[12px] font-semibold italic"
              style={{ color: '#000000', fontFamily: standardBengaliFont }}
            >
              * মাঠ পরিদর্শন ও আদায় কার্যক্রমের প্রমাণক হিসেবে সংরক্ষিত
            </div>

            {/* Right Signature */}
            <div className="w-56 flex flex-col items-center text-center">
              <div className="h-10 w-44 flex items-end justify-center mb-0.5">
                <img
                  src={signatureUrl}
                  alt="Signature"
                  className="max-h-full max-w-full object-contain filter contrast-125"
                />
              </div>
              <div className="w-48 my-0.5" style={{ borderTop: '1px solid #000000' }}></div>
              <div
                className="text-[13px] font-bold leading-tight"
                style={{ color: '#000000', fontFamily: standardBengaliFont }}
              >
                স্বাক্ষর ও তারিখ
              </div>
              <div
                className="text-[13px] font-bold leading-tight"
                style={{ color: '#000000', fontFamily: standardBengaliFont }}
              >
                {officerInfo.designation || 'ফিল্ড অ্যাসিস্ট্যান্ট অফিসার'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

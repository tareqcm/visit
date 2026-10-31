import { OfficerInfo, Samity, FieldPhoto } from '../types';

export const DEFAULT_OFFICER_INFO: OfficerInfo = {
  bankName: 'পল্লী সঞ্চয় ব্যাংক',
  branchName: 'রাঙ্গুনিয়া শাখা',
  districtName: 'চট্টগ্রাম',
  officerName: 'মো: তারেকুল ইসলাম',
  designation: 'মাঠ সহকারী',
  smarokNo: 'পসব/প্রকা/প্রশা-১৩৮/২০২৪-২৫/২৯৫১',
  smarokDate: '১৫/০৫/২০২৫',
  year: 2026,
  month: 10, // November (0-indexed)
};

export const RANGUNIA_UNIONS: string[] = [
  '১নং রাজানগর',
  '২নং হোসনাবাদ',
  '৩নং স্বনির্ভর রাঙ্গুনিয়া',
  '৪নং মরিয়মনগর',
  '৫নং পারুয়া',
  '৬নং পোমরা',
  '৭নং বেতাগী',
  '৮নং সরফভাটা',
  '৯নং শিলক',
  '১০নং পদুয়া',
  '১১নং চন্দ্রঘোনা কদমতলী',
  '১২নং কোদালা',
  '১৩নং ইসলামপুর',
  '১৪নং দক্ষিণ রাজানগর',
  '১৫নং লালানগর',
  'রাঙ্গুনিয়া পৌরসভা',
];

export const DEFAULT_SAMITIES: Samity[] = [
  { id: '1', name: 'রৈস্যাবিলি গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '2', name: 'গুল মোহাম্মদপাড়া গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '3', name: 'মধ্যম ইসলামপুর গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '4', name: 'গাবতলী গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '5', name: 'দক্ষিণ ইসলামপুর গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '6', name: 'পুর্ব ইসলামপুর গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '7', name: 'মুরাদনগর গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '8', name: 'চম্পাতলী গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '9', name: 'শান্তিনগর গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '10', name: 'কদমবাগান গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '11', name: 'নতুনপাড়া গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
  { id: '12', name: 'মাস্টারপাড়া গ্রাম উন্নয়ন সমিতি', unionName: '১৩নং ইসলামপুর', branchName: 'রাঙ্গুনিয়া', active: true },
];

// High fidelity SVG based sample photos matching the user's field visit themes
function generatePhotoSVG(index: number, title: string, color1: string, color2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg${index}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg${index})" />
    <g transform="translate(200, 120)">
      <circle cx="0" cy="0" r="50" fill="#ffffff" opacity="0.9" />
      <circle cx="-16" cy="-10" r="6" fill="#0f172a" />
      <circle cx="16" cy="-10" r="6" fill="#0f172a" />
      <path d="M -22 10 Q 0 34 22 10" stroke="#0f172a" stroke-width="5" stroke-linecap="round" fill="none" />
    </g>
    <rect x="20" y="210" width="360" height="65" rx="8" fill="#000000" opacity="0.45" />
    <text x="200" y="238" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${title}</text>
    <text x="200" y="260" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#e2e8f0">মাঠ পরিদর্শন ও সমিতি উঠান বৈঠক</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_PHOTOS: FieldPhoto[] = [
  { id: '1', url: generatePhotoSVG(1, 'মাঠ পরিদর্শন ছবি ১', '#0d9488', '#115e59'), caption: 'মাঠ পরিদর্শন ছবি ১', timestamp: '20240817_125242', order: 1 },
  { id: '2', url: generatePhotoSVG(2, 'সমিতি সভা ও ঋণ বিতরণ', '#0284c7', '#0369a1'), caption: 'সমিতি সভা ও ঋণ বিতরণ', timestamp: '20240817_125234', order: 2 },
  { id: '3', url: generatePhotoSVG(3, 'উঠান বৈঠক ও সঞ্চয় আদায়', '#7c3aed', '#6d28d9'), caption: 'উঠান বৈঠক ও সঞ্চয় আদায়', timestamp: '20240822_093511', order: 3 },
  { id: '4', url: generatePhotoSVG(4, 'সদস্য পরিচিতি ও যাচাই', '#e11d48', '#be123c'), caption: 'সদস্য পরিচিতি ও যাচাই', timestamp: '20240822_093452', order: 4 },
  { id: '5', url: generatePhotoSVG(5, 'প্রকল্প এলাকা পরিদর্শন', '#ea580c', '#c2410c'), caption: 'প্রকল্প এলাকা পরিদর্শন', timestamp: '20240726_151511', order: 5 },
  { id: '6', url: generatePhotoSVG(6, 'বই ও পাশবই যাচাই', '#16a34a', '#15803d'), caption: 'বই ও পাশবই যাচাই', timestamp: '20240726_151508', order: 6 },
  { id: '7', url: generatePhotoSVG(7, 'নতুন সদস্য অন্তর্ভুক্তি', '#0891b2', '#0e7490'), caption: 'নতুন সদস্য অন্তর্ভুক্তি', timestamp: '20240726_151433', order: 7 },
  { id: '8', url: generatePhotoSVG(8, 'সঞ্চয় জমার হিসাব পরীক্ষণ', '#4f46e5', '#4338ca'), caption: 'সঞ্চয় জমার হিসাব পরীক্ষণ', timestamp: '20240726_151426', order: 8 },
  { id: '9', url: generatePhotoSVG(9, 'সমাপনী সভা ও দিকনির্দেশনা', '#059669', '#047857'), caption: 'সমাপনী সভা ও দিকনির্দেশনা', timestamp: '20240726_151530', order: 9 },
];

// Authentic signature curve matching sample image
export const DEFAULT_SIGNATURE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <path d="M 15 45 C 35 45, 45 35, 60 40 C 75 45, 85 20, 105 38 C 120 48, 140 10, 155 35 C 165 48, 175 42, 185 30" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 60 40 Q 90 48 130 42" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round" />
</svg>
`)}`;

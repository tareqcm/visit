export interface Samity {
  id: string;
  name: string;
  unionName: string;
  branchName?: string;
  active: boolean;
}

export interface WorkingDay {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
  dayNameBn: string;
  isHoliday: boolean;
  holidayReason?: string;
  samityId?: string;
  samityName?: string;
  unionName?: string;
  branchName?: string;
  remarks?: string;
}

export interface OfficerInfo {
  bankName: string;
  branchName: string;
  districtName?: string;
  officerName: string;
  designation: string;
  smarokNo: string;
  smarokDate: string; // e.g. "১৫/০৫/২০২৫"
  year: number; // e.g. 2026
  month: number; // 0-11, e.g. 10 for November
}

export interface FieldPhoto {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  order: number;
}

export interface SavedMonthlyReport {
  id: string; // "YYYY-MM"
  year: number;
  month: number;
  monthYearLabel: string; // e.g. "নভেম্বর/২০২৬"
  savedAt: string; // ISO
  savedAtFormatted: string; // e.g. "২৯/১০/২০২৬, ১১:৩০"
  officerInfo: OfficerInfo;
  workingDays: WorkingDay[];
  photos: FieldPhoto[];
  signatureUrl: string;
  totalVisits: number;
  totalPhotos: number;
}

export interface OfficerSummary {
  officerId: string;
  officerName: string;
  designation: string;
  email: string;
  unionName: string;
  branchName?: string;
  districtName?: string;
  samitiesCount: number;
  reportsCount: number;
  hasScheduleCurrentMonth?: boolean;
  photosCount?: number;
  lastActive: string;
  updatedAt: string;
  index?: number;
}

export type ActiveTab = 'dashboard' | 'preview' | 'calendar' | 'photos' | 'samities' | 'settings' | 'archive' | 'admin';

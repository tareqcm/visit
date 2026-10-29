import { get, set, del } from 'idb-keyval';
import { FieldPhoto, WorkingDay, SavedMonthlyReport } from '../types';
import { DEFAULT_PHOTOS } from './initialData';

const ARCHIVE_KEY = 'vromon_saved_reports_archive_v1';

export function getMonthStorageKey(year: number, month: number, prefix: string): string {
  return `${prefix}_${year}_${month}`;
}

/**
 * Loads photos for a specific month and year.
 * If November 2026 and no photos saved yet, falls back to default sample photos.
 */
export async function loadPhotosForMonth(year: number, month: number): Promise<FieldPhoto[]> {
  try {
    const key = getMonthStorageKey(year, month, 'photos');
    const stored = await get<FieldPhoto[]>(key);
    if (stored && Array.isArray(stored)) {
      return stored;
    }

    // Check localStorage fallback
    const local = localStorage.getItem(key);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // If it's November 2026 (the default demo month), provide initial sample photos
    if (year === 2026 && month === 10) {
      return DEFAULT_PHOTOS;
    }

    return [];
  } catch (e) {
    console.warn('Error loading photos for month', year, month, e);
    return [];
  }
}

/**
 * Saves photos for a specific month and year.
 */
export async function savePhotosForMonth(year: number, month: number, photos: FieldPhoto[]): Promise<void> {
  const key = getMonthStorageKey(year, month, 'photos');
  try {
    await set(key, photos);
  } catch (e) {
    console.warn('IndexedDB set failed, trying localStorage', e);
    try {
      localStorage.setItem(key, JSON.stringify(photos));
    } catch (err) {
      console.error('Failed to save photos to storage', err);
    }
  }
}

/**
 * Loads days for a specific month and year.
 */
export async function loadDaysForMonth(year: number, month: number): Promise<WorkingDay[] | null> {
  try {
    const key = getMonthStorageKey(year, month, 'days');
    const stored = await get<WorkingDay[]>(key);
    if (stored && Array.isArray(stored)) {
      return stored;
    }

    const local = localStorage.getItem(key);
    if (local) {
      return JSON.parse(local);
    }

    return null;
  } catch (e) {
    console.warn('Error loading days for month', year, month, e);
    return null;
  }
}

/**
 * Saves days for a specific month and year.
 */
export async function saveDaysForMonth(year: number, month: number, days: WorkingDay[]): Promise<void> {
  const key = getMonthStorageKey(year, month, 'days');
  try {
    await set(key, days);
  } catch (e) {
    try {
      localStorage.setItem(key, JSON.stringify(days));
    } catch (err) {
      console.error('Failed to save days to storage', err);
    }
  }
}

/**
 * Gets all saved monthly reports from archive.
 */
export async function getSavedReports(): Promise<SavedMonthlyReport[]> {
  try {
    const stored = await get<SavedMonthlyReport[]>(ARCHIVE_KEY);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    const local = localStorage.getItem(ARCHIVE_KEY);
    if (local) {
      return JSON.parse(local);
    }
    return [];
  } catch (e) {
    console.warn('Error loading saved reports', e);
    return [];
  }
}

/**
 * Saves or updates a complete monthly report in the archive.
 */
export async function saveMonthlyReport(report: SavedMonthlyReport): Promise<SavedMonthlyReport[]> {
  const existing = await getSavedReports();
  // If report for this year and month exists, update it; otherwise prepend
  const filtered = existing.filter((r) => r.id !== report.id);
  const updated = [report, ...filtered];

  try {
    await set(ARCHIVE_KEY, updated);
  } catch (e) {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save report to archive', err);
    }
  }

  // Also ensure the month's photos and days are synced
  await savePhotosForMonth(report.year, report.month, report.photos);
  await saveDaysForMonth(report.year, report.month, report.workingDays);

  return updated;
}

/**
 * Deletes a report from the archive.
 */
export async function deleteSavedReport(reportId: string): Promise<SavedMonthlyReport[]> {
  const existing = await getSavedReports();
  const updated = existing.filter((r) => r.id !== reportId);
  try {
    await set(ARCHIVE_KEY, updated);
  } catch {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
  }
  return updated;
}

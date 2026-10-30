import { get, set } from 'idb-keyval';
import { FieldPhoto, WorkingDay, SavedMonthlyReport } from '../types';
import { DEFAULT_PHOTOS } from './initialData';

export function getMonthStorageKey(year: number, month: number, prefix: string, userId?: string): string {
  const scope = userId ? `user_${userId}` : 'guest';
  return `${scope}_${prefix}_${year}_${month}`;
}

export function getArchiveStorageKey(userId?: string): string {
  const scope = userId ? `user_${userId}` : 'guest';
  return `${scope}_vromon_saved_reports_archive_v1`;
}

/**
 * Loads photos for a specific month and year, scoped to an officer UID.
 */
export async function loadPhotosForMonth(
  year: number,
  month: number,
  userId?: string
): Promise<FieldPhoto[]> {
  try {
    const key = getMonthStorageKey(year, month, 'photos', userId);
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

    // If it's November 2026 (the default demo month) and guest/new, provide initial sample photos
    if (year === 2026 && month === 10 && !userId) {
      return DEFAULT_PHOTOS;
    }

    return [];
  } catch (e) {
    console.warn('Error loading photos for month', year, month, e);
    return [];
  }
}

/**
 * Saves photos for a specific month and year, scoped to an officer UID.
 */
export async function savePhotosForMonth(
  year: number,
  month: number,
  photos: FieldPhoto[],
  userId?: string
): Promise<void> {
  const key = getMonthStorageKey(year, month, 'photos', userId);
  try {
    await set(key, photos);
  } catch (e) {
    try {
      localStorage.setItem(key, JSON.stringify(photos));
    } catch (err) {
      console.error('Failed to save photos to storage', err);
    }
  }
}

/**
 * Loads days for a specific month and year, scoped to an officer UID.
 */
export async function loadDaysForMonth(
  year: number,
  month: number,
  userId?: string
): Promise<WorkingDay[] | null> {
  try {
    const key = getMonthStorageKey(year, month, 'days', userId);
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
 * Saves days for a specific month and year, scoped to an officer UID.
 */
export async function saveDaysForMonth(
  year: number,
  month: number,
  days: WorkingDay[],
  userId?: string
): Promise<void> {
  const key = getMonthStorageKey(year, month, 'days', userId);
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
 * Gets all saved monthly reports from archive, scoped to an officer UID.
 */
export async function getSavedReports(userId?: string): Promise<SavedMonthlyReport[]> {
  const archiveKey = getArchiveStorageKey(userId);
  try {
    const stored = await get<SavedMonthlyReport[]>(archiveKey);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    const local = localStorage.getItem(archiveKey);
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
 * Saves or updates a complete monthly report in the archive, scoped to an officer UID.
 */
export async function saveMonthlyReport(
  report: SavedMonthlyReport,
  userId?: string
): Promise<SavedMonthlyReport[]> {
  const archiveKey = getArchiveStorageKey(userId);
  const existing = await getSavedReports(userId);
  const filtered = existing.filter((r) => r.id !== report.id);
  const updated = [report, ...filtered];

  try {
    await set(archiveKey, updated);
  } catch (e) {
    try {
      localStorage.setItem(archiveKey, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save report to archive', err);
    }
  }

  // Also ensure the month's photos and days are synced
  await savePhotosForMonth(report.year, report.month, report.photos, userId);
  await saveDaysForMonth(report.year, report.month, report.workingDays, userId);

  return updated;
}

/**
 * Deletes a report from the archive, scoped to an officer UID.
 */
export async function deleteSavedReport(
  reportId: string,
  userId?: string
): Promise<SavedMonthlyReport[]> {
  const archiveKey = getArchiveStorageKey(userId);
  const existing = await getSavedReports(userId);
  const updated = existing.filter((r) => r.id !== reportId);
  try {
    await set(archiveKey, updated);
  } catch {
    localStorage.setItem(archiveKey, JSON.stringify(updated));
  }
  return updated;
}

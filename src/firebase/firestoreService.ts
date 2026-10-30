import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './config';
import { OfficerInfo, Samity, WorkingDay, FieldPhoto, SavedMonthlyReport } from '../types';

/**
 * Service to manage all Firestore cloud data strictly partitioned per Officer UID.
 * This guarantees that each of the 25 officers only accesses and modifies their own unique records.
 */

// Save or Update Officer Profile in Firestore
export async function saveCloudOfficerProfile(
  userId: string,
  officerInfo: OfficerInfo,
  signatureUrl: string,
  assignedUnion?: string
): Promise<void> {
  if (!userId) return;
  const userProfileRef = doc(db, 'users', userId, 'profile', 'info');
  await setDoc(
    userProfileRef,
    {
      userId,
      officerName: officerInfo.officerName,
      designation: officerInfo.designation,
      bankName: officerInfo.bankName,
      branchName: officerInfo.branchName,
      smarokNo: officerInfo.smarokNo,
      smarokDate: officerInfo.smarokDate,
      year: officerInfo.year,
      month: officerInfo.month,
      signatureUrl,
      assignedUnion: assignedUnion || '',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// Load Officer Profile from Firestore
export async function loadCloudOfficerProfile(
  userId: string
): Promise<{ officerInfo?: Partial<OfficerInfo>; signatureUrl?: string; assignedUnion?: string } | null> {
  if (!userId) return null;
  try {
    const userProfileRef = doc(db, 'users', userId, 'profile', 'info');
    const snap = await getDoc(userProfileRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        officerInfo: {
          officerName: data.officerName,
          designation: data.designation,
          bankName: data.bankName,
          branchName: data.branchName,
          smarokNo: data.smarokNo,
          smarokDate: data.smarokDate,
          year: data.year,
          month: data.month,
        },
        signatureUrl: data.signatureUrl,
        assignedUnion: data.assignedUnion,
      };
    }
  } catch (error) {
    console.error('Error loading officer profile from Firestore:', error);
  }
  return null;
}

// Save Samities for Officer
export async function saveCloudSamities(userId: string, samities: Samity[]): Promise<void> {
  if (!userId) return;
  try {
    // Store as document in user's profile or batch in subcollection
    const docRef = doc(db, 'users', userId, 'profile', 'samities');
    await setDoc(docRef, {
      userId,
      samities,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving samities to Firestore:', error);
  }
}

// Load Samities for Officer
export async function loadCloudSamities(userId: string): Promise<Samity[] | null> {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'samities');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().samities as Samity[];
    }
  } catch (error) {
    console.error('Error loading samities from Firestore:', error);
  }
  return null;
}

// Save Monthly Working Days Schedule for Officer
export async function saveCloudSchedule(
  userId: string,
  year: number,
  month: number,
  days: WorkingDay[]
): Promise<void> {
  if (!userId) return;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  try {
    const docRef = doc(db, 'users', userId, 'months', monthKey);
    await setDoc(docRef, {
      id: monthKey,
      year,
      month,
      days: JSON.stringify(days),
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving month schedule to Firestore:', error);
  }
}

// Load Monthly Working Days Schedule for Officer
export async function loadCloudSchedule(
  userId: string,
  year: number,
  month: number
): Promise<WorkingDay[] | null> {
  if (!userId) return null;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  try {
    const docRef = doc(db, 'users', userId, 'months', monthKey);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().days) {
      return JSON.parse(snap.data().days) as WorkingDay[];
    }
  } catch (error) {
    console.error('Error loading month schedule from Firestore:', error);
  }
  return null;
}

// Save Monthly Field Photos for Officer
export async function saveCloudPhotos(
  userId: string,
  year: number,
  month: number,
  photos: FieldPhoto[]
): Promise<void> {
  if (!userId) return;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  try {
    const docRef = doc(db, 'users', userId, 'photos', monthKey);
    await setDoc(docRef, {
      id: monthKey,
      monthKey,
      photosJson: JSON.stringify(photos),
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving photos to Firestore:', error);
  }
}

// Load Monthly Field Photos for Officer
export async function loadCloudPhotos(
  userId: string,
  year: number,
  month: number
): Promise<FieldPhoto[] | null> {
  if (!userId) return null;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  try {
    const docRef = doc(db, 'users', userId, 'photos', monthKey);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().photosJson) {
      return JSON.parse(snap.data().photosJson) as FieldPhoto[];
    }
  } catch (error) {
    console.error('Error loading photos from Firestore:', error);
  }
  return null;
}

// Save Archived Monthly Report for Officer
export async function saveCloudReport(userId: string, report: SavedMonthlyReport): Promise<void> {
  if (!userId) return;
  try {
    const docRef = doc(db, 'users', userId, 'reports', report.id);
    await setDoc(docRef, {
      id: report.id,
      year: report.year,
      month: report.month,
      monthYearLabel: report.monthYearLabel,
      savedAt: report.savedAt,
      savedAtFormatted: report.savedAtFormatted,
      reportData: JSON.stringify(report),
      totalVisits: report.totalVisits,
      totalPhotos: report.totalPhotos,
      userId,
    });
  } catch (error) {
    console.error('Error saving report to Firestore:', error);
  }
}

// Load All Archived Monthly Reports for Officer
export async function loadCloudReports(userId: string): Promise<SavedMonthlyReport[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'reports');
    const snapshot = await getDocs(colRef);
    const reports: SavedMonthlyReport[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.reportData) {
        try {
          reports.push(JSON.parse(data.reportData));
        } catch {
          // ignore corrupted
        }
      }
    });
    // sort newest first
    reports.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    return reports;
  } catch (error) {
    console.error('Error loading reports from Firestore:', error);
    return [];
  }
}

// Delete Archived Report for Officer
export async function deleteCloudReport(userId: string, reportId: string): Promise<void> {
  if (!userId) return;
  try {
    const docRef = doc(db, 'users', userId, 'reports', reportId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting report from Firestore:', error);
  }
}

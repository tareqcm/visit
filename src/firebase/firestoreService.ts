import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './config';
import { OfficerInfo, Samity, WorkingDay, FieldPhoto, SavedMonthlyReport, OfficerSummary } from '../types';

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
      districtName: officerInfo.districtName || '',
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
          districtName: data.districtName || '',
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
    console.warn('Error loading officer profile from Firestore:', error);
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
    console.warn('Error saving samities to Firestore:', error);
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
    console.warn('Error loading samities from Firestore:', error);
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
    console.warn('Error saving month schedule to Firestore:', error);
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
    console.warn('Error loading month schedule from Firestore:', error);
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
    console.warn('Error saving photos to Firestore:', error);
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
    console.warn('Error loading photos from Firestore:', error);
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
    console.warn('Error saving report to Firestore:', error);
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
    console.warn('Error loading reports from Firestore:', error);
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
    console.warn('Error deleting report from Firestore:', error);
  }
}

// Sync officer summary to officers_registry (for Admin oversight)
export async function syncOfficerToRegistry(summary: OfficerSummary): Promise<void> {
  if (!summary.officerId) return;
  try {
    const docRef = doc(db, 'officers_registry', summary.officerId);
    await setDoc(
      docRef,
      {
        ...summary,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not sync to officers_registry:', error);
  }
}

// Fetch all officers from Firestore for Admin Panel
export async function fetchAllOfficersForAdmin(): Promise<OfficerSummary[]> {
  try {
    const colRef = collection(db, 'officers_registry');
    const snap = await getDocs(colRef);
    const registry: OfficerSummary[] = [];
    snap.forEach((docSnap) => {
      registry.push(docSnap.data() as OfficerSummary);
    });
    return registry;
  } catch (error) {
    console.warn('Error fetching all officers for admin:', error);
    return [];
  }
}

// Delete an officer and their records from Firestore (Admin only)
export async function deleteOfficerFromFirestore(officerId: string): Promise<boolean> {
  if (!officerId) return false;
  try {
    // 1. Delete from officers_registry
    const regRef = doc(db, 'officers_registry', officerId);
    await deleteDoc(regRef);

    // 2. Delete user's profile documents
    try {
      await deleteDoc(doc(db, 'users', officerId, 'profile', 'info'));
      await deleteDoc(doc(db, 'users', officerId, 'profile', 'samities'));
    } catch (err) {
      console.warn('Error deleting user profile docs:', err);
    }

    // 3. Delete user's reports
    try {
      const reportsCol = collection(db, 'users', officerId, 'reports');
      const repSnap = await getDocs(reportsCol);
      for (const d of repSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn('Error deleting user reports:', err);
    }

    return true;
  } catch (error) {
    console.error('Error deleting officer from Firestore:', error);
    return false;
  }
}


import { WorkingDay, Samity } from '../types';
import { BENGALI_DAYS } from './bengaliNumerals';

// Standard Bangladesh Bank Public Holidays (recurring fixed dates)
const BANGLADESH_FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': 'ইংরেজি নববর্ষ (ব্যাংক বন্ধ)',
  '02-21': 'আন্তর্জাতিক মাতৃভাষা দিবস',
  '03-17': 'বঙ্গবন্ধুর জন্মবার্ষিকী',
  '03-26': 'স্বাধীনতা দিবস',
  '04-14': 'পহেলা বৈশাখ',
  '05-01': 'মে দিবস',
  '07-01': 'ব্যাংক হলিডে',
  '08-15': 'জাতীয় শোক দিবস',
  '12-16': 'বিজয় দিবস',
  '12-25': 'যিশু খ্রিস্টের জন্মদিন (বড়দিন)',
  '12-31': 'ব্যাংক হলিডে',
};

/**
 * Generates all calendar days for a specific year and month (0-indexed).
 * Auto-detects Bangladesh weekend (Friday & Saturday) and public holidays.
 */
export function generateMonthDays(year: number, month: number, existingDays?: WorkingDay[]): WorkingDay[] {
  const existingMap = new Map<string, WorkingDay>();
  if (existingDays) {
    for (const d of existingDays) {
      existingMap.set(d.date, d);
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: WorkingDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const monthDayStr = `${mm}-${dd}`;

    // If already modified by user, keep their preference
    const existing = existingMap.get(dateStr);
    if (existing) {
      days.push(existing);
      continue;
    }

    // Default Bangladesh banking rules:
    // Friday (5) and Saturday (6) are weekly holidays
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const fixedHoliday = BANGLADESH_FIXED_HOLIDAYS[monthDayStr];

    let isHoliday = false;
    let holidayReason = '';

    if (isWeekend) {
      isHoliday = true;
      holidayReason = dayOfWeek === 5 ? 'শুক্রবার (সাপ্তাহিক ছুটি)' : 'শনিবার (সাপ্তাহিক ছুটি)';
    } else if (fixedHoliday) {
      isHoliday = true;
      holidayReason = fixedHoliday;
    }

    days.push({
      date: dateStr,
      dayOfMonth: day,
      dayOfWeek,
      dayNameBn: BENGALI_DAYS[dayOfWeek],
      isHoliday,
      holidayReason,
    });
  }

  return days;
}

/**
 * Distributes active Samities across working days based on the user's rule:
 * "১ম যতগুলো সমিতি আছে তা খোলার দিনগুলো এক বার করে দেখাবেন। তার পর আরো খোলার তারিখ অবশিষ্ঠ থাকলে সেগুলো দৈব্যভাবে ২য় বার ভিন্ন তারিখে একই সমিতির নাম দেখাবেন।"
 */
export function distributeSamitiesToWorkingDays(
  days: WorkingDay[],
  samities: Samity[],
  branchName: string = 'রাঙ্গুনিয়া'
): WorkingDay[] {
  const activeSamities = samities.filter((s) => s.active);
  if (activeSamities.length === 0) {
    return days.map((d) => ({
      ...d,
      samityId: undefined,
      samityName: undefined,
      unionName: undefined,
      branchName: undefined,
    }));
  }

  const workingDaysIndices: number[] = [];
  days.forEach((day, index) => {
    if (!day.isHoliday) {
      workingDaysIndices.push(index);
    }
  });

  const totalWorkingDays = workingDaysIndices.length;
  const totalSamities = activeSamities.length;
  const assignment: { samity: Samity }[] = [];

  // Phase 1: Assign each samity at least once
  for (let i = 0; i < Math.min(totalSamities, totalWorkingDays); i++) {
    assignment.push({ samity: activeSamities[i] });
  }

  // Phase 2: If there are remaining working days, randomly pick from the samities for a 2nd visit
  if (totalWorkingDays > totalSamities) {
    const remainingSlots = totalWorkingDays - totalSamities;
    
    // Shuffle active samities for the 2nd pass
    const shuffledForSecondPass = [...activeSamities].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < remainingSlots; i++) {
      // Pick next samity, cycling if remainingSlots > totalSamities
      const picked = shuffledForSecondPass[i % shuffledForSecondPass.length];
      assignment.push({ samity: picked });
    }
  }

  // Assign to working days in copy
  const updatedDays = [...days];
  let assignIdx = 0;

  for (const dayIdx of workingDaysIndices) {
    if (assignIdx < assignment.length) {
      const { samity } = assignment[assignIdx];
      updatedDays[dayIdx] = {
        ...updatedDays[dayIdx],
        samityId: samity.id,
        samityName: samity.name,
        unionName: samity.unionName,
        branchName: samity.branchName || branchName,
      };
      assignIdx++;
    }
  }

  return updatedDays;
}

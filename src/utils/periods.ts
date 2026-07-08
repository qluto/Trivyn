import { GoalLevel } from '../types';

export interface PeriodRange {
  start: Date;
  end: Date;
}

// 目標階層: daily → weekly → monthly
export function getParentLevel(level: GoalLevel): GoalLevel | null {
  if (level === 'daily') return 'weekly';
  if (level === 'weekly') return 'monthly';
  return null;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getWeekStartDate(date: Date, weekStart: number): Date {
  const targetWeekday = (weekStart - 1) % 7;
  const currentWeekday = date.getDay();
  const daysDiff = (currentWeekday - targetWeekday + 7) % 7;
  const result = startOfDay(date);
  result.setDate(result.getDate() - daysDiff);
  return result;
}

function getWeekOfYear(date: Date): { year: number; week: number } {
  const year = date.getFullYear();
  const onejan = new Date(year, 0, 1);
  const week = Math.ceil(
    (((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7
  );
  return { year, week };
}

export function getWeekNumber(date: Date, weekStart: number): { year: number; week: number } {
  // 期間内のどの日付でも同じ週番号になるよう、週の開始日に正規化してから計算する
  return getWeekOfYear(getWeekStartDate(date, weekStart));
}

export function getPeriodKey(level: GoalLevel, date: Date, weekStart: number): string {
  if (level === 'daily') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (level === 'weekly') {
    const { year, week } = getWeekNumber(date, weekStart);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getPeriodRange(level: GoalLevel, date: Date, weekStart: number): PeriodRange {
  if (level === 'daily') {
    return { start: startOfDay(date), end: endOfDay(date) };
  }
  if (level === 'weekly') {
    const start = getWeekStartDate(date, weekStart);
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
    return { start, end };
  }
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function addPeriods(level: GoalLevel, date: Date, delta: number): Date {
  const result = new Date(date);
  if (level === 'daily') {
    result.setDate(result.getDate() + delta);
  } else if (level === 'weekly') {
    result.setDate(result.getDate() + delta * 7);
  } else {
    // 月末日（29〜31日）からの setMonth は日付あふれで隣の月に転がるため、
    // 月初に固定してから加算する（月バケットでは日付は使われない）
    result.setDate(1);
    result.setMonth(result.getMonth() + delta);
  }
  return result;
}

export function isSamePeriod(
  level: GoalLevel,
  date1: Date,
  date2: Date,
  weekStart: number
): boolean {
  return getPeriodKey(level, normalize(level, date1, weekStart), weekStart) ===
    getPeriodKey(level, normalize(level, date2, weekStart), weekStart);
}

function normalize(level: GoalLevel, date: Date, weekStart: number): Date {
  return getPeriodRange(level, date, weekStart).start;
}

export function isCurrentOrPastPeriod(
  level: GoalLevel,
  date: Date,
  weekStart: number,
  now: Date = new Date()
): boolean {
  const targetStart = getPeriodRange(level, date, weekStart).start;
  const currentStart = getPeriodRange(level, now, weekStart).start;
  return targetStart.getTime() <= currentStart.getTime();
}

export function formatPeriodLabel(
  level: GoalLevel,
  date: Date,
  weekStart: number,
  language: string
): string {
  const { start, end } = getPeriodRange(level, date, weekStart);
  const isJa = language === 'ja';

  if (level === 'daily') {
    if (isJa) {
      return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日`;
    }
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  }

  if (level === 'weekly') {
    const { week } = getWeekNumber(date, weekStart);
    if (isJa) {
      return `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()} (第${week}週)`;
    }
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[start.getMonth()]} ${start.getDate()} – ${monthNames[end.getMonth()]} ${end.getDate()} (W${week})`;
  }

  if (isJa) {
    return `${start.getFullYear()}年${start.getMonth() + 1}月`;
  }
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
}

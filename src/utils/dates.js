// Date helpers for Monefy.
//
// Every date in the app is a plain calendar date ("YYYY-MM-DD"), not a moment in time.
// Do NOT build one with toISOString() (that is UTC) and do NOT parse one with
// new Date("YYYY-MM-DD") (that is UTC midnight). Both drift by a day, or even a month,
// depending on the device timezone. Use the helpers below instead.

const pad = (n) => String(n).padStart(2, "0");

// Local calendar date of a Date object, as "YYYY-MM-DD".
export const toISODate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Today's date on the user's device clock.
export const todayISO = () => toISODate(new Date());

// "YYYY-MM-DD" (a longer timestamp string is accepted too) -> { year, month (0-11), day, dow (0 = Sunday) }.
// Returns null when the value is not a date.
export function parseISODate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str || "");
  if (!m) return null;
  const year = +m[1], month = +m[2] - 1, day = +m[3];
  return { year, month, day, dow: new Date(year, month, day).getDay() };
}

export const dowOf = (str) => parseISODate(str)?.dow;   // 0 = Sunday ... 6 = Saturday
export const domOf = (str) => parseISODate(str)?.day;   // day of month, 1-31

// Is this date in the given month (0-11) and year?
export function isInMonth(str, month, year) {
  const p = parseISODate(str);
  return !!p && p.month === month && p.year === year;
}

// "YYYY-MM-DD" plus n days (n may be negative).
export function addDaysISO(str, n) {
  const p = parseISODate(str);
  return p ? toISODate(new Date(p.year, p.month, p.day + n)) : null;
}

// Whole days from date a to date b (b minus a). NaN if either is not a date.
export function daysBetween(a, b) {
  const x = parseISODate(a), y = parseISODate(b);
  if (!x || !y) return NaN;
  return Math.round((Date.UTC(y.year, y.month, y.day) - Date.UTC(x.year, x.month, x.day)) / 86400000);
}

// Year choices that roll forward on their own: two years back through next year.
export function defaultYears(now = new Date()) {
  const y = now.getFullYear();
  return [y - 2, y - 1, y, y + 1];
}

// The defaults, widened so every year that has data (and the selected year) is always selectable.
export function yearOptions(transactions = [], selectedYear) {
  const base = defaultYears();
  let min = base[0], max = base[base.length - 1];
  for (const t of transactions) {
    const p = parseISODate(t.date);
    if (p) { if (p.year < min) min = p.year; if (p.year > max) max = p.year; }
  }
  if (Number.isInteger(selectedYear)) { min = Math.min(min, selectedYear); max = Math.max(max, selectedYear); }
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}
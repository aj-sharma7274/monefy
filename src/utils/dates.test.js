import {
  toISODate, todayISO, parseISODate, dowOf, domOf, isInMonth,
  addDaysISO, daysBetween, defaultYears, yearOptions,
} from "./dates";

// These tests build every Date from LOCAL parts, so they pass in any timezone.
// (The old toISOString()-based code failed them anywhere east of UTC, such as India.)

describe("todayISO / toISODate", () => {
  afterEach(() => jest.useRealTimers());

  test("shortly after local midnight it is still the new local day", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 28, 0, 10)); // 28 Oct 2026, 00:10 local
    expect(todayISO()).toBe("2026-10-28");
  });

  test("late in the evening it is still the same local day", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 28, 23, 50));
    expect(todayISO()).toBe("2026-10-28");
  });

  test("toISODate pads month and day", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("parseISODate", () => {
  test("reads year, month (0-based), day and weekday", () => {
    expect(parseISODate("2026-10-01")).toEqual({ year: 2026, month: 9, day: 1, dow: 4 }); // Thursday
  });
  test("accepts a longer timestamp string", () => {
    expect(parseISODate("2026-10-01T00:00:00+00:00").month).toBe(9);
  });
  test("returns null for non-dates", () => {
    expect(parseISODate("")).toBeNull();
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate("not a date")).toBeNull();
  });
  test("dowOf and domOf", () => {
    expect(dowOf("2026-10-25")).toBe(0); // Sunday
    expect(domOf("2026-10-25")).toBe(25);
  });
});

describe("isInMonth", () => {
  test("first and last day of the month belong to that month", () => {
    expect(isInMonth("2026-10-01", 9, 2026)).toBe(true);
    expect(isInMonth("2026-10-31", 9, 2026)).toBe(true);
  });
  test("neighbouring months and years do not", () => {
    expect(isInMonth("2026-09-30", 9, 2026)).toBe(false);
    expect(isInMonth("2026-11-01", 9, 2026)).toBe(false);
    expect(isInMonth("2025-10-15", 9, 2026)).toBe(false);
  });
  test("invalid dates are never in a month", () => {
    expect(isInMonth(undefined, 9, 2026)).toBe(false);
  });
});

describe("addDaysISO / daysBetween (reminder window)", () => {
  test("two days out, across month and year ends", () => {
    expect(addDaysISO("2026-10-28", 2)).toBe("2026-10-30");
    expect(addDaysISO("2026-10-30", 2)).toBe("2026-11-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
  });
  test("going backwards and leap years", () => {
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysISO("2028-02-28", 1)).toBe("2028-02-29");
  });
  test("daysBetween", () => {
    expect(daysBetween("2026-10-28", "2026-10-30")).toBe(2);
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
    expect(daysBetween("2026-10-30", "2026-10-28")).toBe(-2);
    expect(daysBetween("2026-10-28", "2026-10-28")).toBe(0);
    expect(daysBetween("x", "2026-10-28")).toBeNaN();
  });
});

describe("year options", () => {
  test("defaults roll forward with the calendar", () => {
    expect(defaultYears(new Date(2026, 9, 29))).toEqual([2024, 2025, 2026, 2027]);
    expect(defaultYears(new Date(2028, 0, 1))).toEqual([2026, 2027, 2028, 2029]);
  });
  test("widened to cover older data", () => {
    const years = yearOptions([{ date: "2021-05-01" }, { date: "2026-02-01" }], 2026);
    expect(years[0]).toBe(2021);
    expect(years).toEqual([...Array(years.length)].map((_, i) => 2021 + i)); // contiguous
  });
  test("always includes the selected year", () => {
    expect(yearOptions([], 2035)).toContain(2035);
  });
});
/** Reporting periods for weekly and monthly snapshots. Weeks start on Monday; dates are Melbourne dates. */
export const PERIODS = [
  { value: "this-week", label: "This week" },
  { value: "last-week", label: "Last week" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
] as const;
export type PeriodKey = (typeof PERIODS)[number]["value"];
export type PeriodRange = { key: PeriodKey; label: string; from: string; to: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Today's date in Melbourne as YYYY-MM-DD. */
export function todayInMelbourne(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(now);
}

export function periodRange(key: string | null | undefined, today: string): PeriodRange | null {
  const p = PERIODS.find((x) => x.value === key);
  if (!p) return null;
  const t = new Date(`${today}T00:00:00Z`);
  const dow = (t.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(t);
  monday.setUTCDate(t.getUTCDate() - dow);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  switch (p.value) {
    case "this-week":
      return { key: p.value, label: p.label, from: iso(monday), to: today };
    case "last-week": {
      const from = new Date(monday);
      from.setUTCDate(monday.getUTCDate() - 7);
      const to = new Date(monday);
      to.setUTCDate(monday.getUTCDate() - 1);
      return { key: p.value, label: p.label, from: iso(from), to: iso(to) };
    }
    case "this-month":
      return { key: p.value, label: p.label, from: iso(new Date(Date.UTC(y, m, 1))), to: today };
    case "last-month":
      return { key: p.value, label: p.label, from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) };
  }
}

export const inRange = (date: string | null | undefined, r: PeriodRange) => Boolean(date && date >= r.from && date <= r.to);

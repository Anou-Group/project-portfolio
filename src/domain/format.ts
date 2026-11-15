const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-22" → "22 Oct 2026". Works on the date part only, so no time-zone drift. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-10" → "October 2026". */
export function formatMonth(isoMonth: string): string {
  const [y, m] = isoMonth.split("-").map(Number);
  const long = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${long[m - 1]} ${y}`;
}

/** "20 Oct – 10 Nov 2026" (or with both years when they differ). */
export function formatRange(from: string, to: string): string {
  if (from === to) return formatDate(from);
  const [fy] = from.split("-");
  const [ty] = to.split("-");
  const a = formatDate(from);
  return fy === ty ? `${a.slice(0, a.lastIndexOf(" "))} – ${formatDate(to)}` : `${a} – ${formatDate(to)}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

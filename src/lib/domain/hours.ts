import type { OpeningHours } from "./contact";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** [1,2,3,4,5,6,7] → "Mon–Sun"; [1,2,3,4,5,7] → "Mon–Fri, Sun"; [1,3,5] → "Mon, Wed, Fri". */
export function dayRanges(days: readonly number[]): string {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  const ranges: Array<[number, number]> = [];
  for (const day of sorted) {
    const last = ranges.at(-1);
    if (last && day === last[1] + 1) last[1] = day;
    else ranges.push([day, day]);
  }
  return ranges
    .map(([a, b]) => (a === b ? DAY_NAMES[a - 1] : `${DAY_NAMES[a - 1]}–${DAY_NAMES[b - 1]}`))
    .join(", ");
}

/** "08:30" → "8:30 AM", "20:00" → "8:00 PM". */
export function formatTime(hhmm: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/** "Mon–Sun 8:30 AM – 8:00 PM" */
export function hoursLine(hours: OpeningHours): string {
  return `${dayRanges(hours.days)} ${formatTime(hours.open)} – ${formatTime(hours.close)}`;
}

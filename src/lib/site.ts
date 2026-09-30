import type { OpeningHours } from "@/lib/domain/contact";
import type { Settings } from "@/lib/settings/schema";

/** Public base URL of the site, for links inside WhatsApp messages and metadata. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function hoursFrom(settings: Settings): OpeningHours {
  return { days: settings.open_days, open: settings.open_time, close: settings.close_time };
}

/** Split settings text into paragraphs (blank line = new paragraph). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Pharmacist contact helpers: phone numbers, WhatsApp and call links, "open now". Pure functions. */

export const SHOP_TIMEZONE = "Africa/Nairobi";

/**
 * Kenyan mobile number → international digits (2547XXXXXXXX / 2541XXXXXXXX).
 * Accepts 0712 345 678, +254 712 345 678, 254712345678, 712345678. Returns null if invalid.
 * Mirrors public.normalise_msisdn() in the database.
 */
export function normaliseMsisdn(number: string): string | null {
  const digits = number.replace(/\D+/g, "");
  const local = /^0?([17]\d{8})$/.exec(digits);
  if (local) return `254${local[1]}`;
  return /^254[17]\d{8}$/.test(digits) ? digits : null;
}

/** "254712345678" → "0712 345 678" for display; anything unrecognised is returned as is. */
export function formatMsisdnLocal(number: string): string {
  const msisdn = normaliseMsisdn(number);
  if (!msisdn) return number;
  const local = `0${msisdn.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/**
 * https://wa.me link with an optional pre-filled message, fully URL-encoded.
 * Line breaks become %0A and must survive: never pass this through anything that "sanitises" URLs
 * by stripping encoded characters (the WordPress build lost its line breaks that way).
 */
export function whatsappUrl(whatsappNumber: string, message = ""): string {
  const url = `https://wa.me/${whatsappNumber}`;
  return message === "" ? url : `${url}?text=${encodeURIComponent(message)}`;
}

/** tel: link. Kenyan mobiles become +254…; anything else keeps its digits and a leading +. */
export function telUrl(callNumber: string): string {
  const msisdn = normaliseMsisdn(callNumber);
  return `tel:${msisdn ? `+${msisdn}` : callNumber.replace(/[^\d+]/g, "")}`;
}

export interface OpeningHours {
  /** ISO weekdays, 1 = Monday … 7 = Sunday. */
  days: number[];
  /** "HH:MM", 24-hour. */
  open: string;
  close: string;
}

/** Weekday (1 = Mon … 7 = Sun) and "HH:MM" at the shop, whatever the visitor's own timezone. */
export function shopNow(date: Date, timeZone: string = SHOP_TIMEZONE): { day: number; time: string } {
  const parts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)) {
    parts[p.type] = p.value;
  }
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday) + 1;
  return { day, time: `${parts.hour}:${parts.minute}` };
}

/**
 * Whether the pharmacy is open at `date`. Called in the browser (pages are cached, so the server
 * can't know "now"). Opening time is inclusive, closing time exclusive.
 */
export function isOpen(hours: OpeningHours, date: Date, timeZone: string = SHOP_TIMEZONE): boolean {
  const now = shopNow(date, timeZone);
  return hours.days.includes(now.day) && now.time >= hours.open && now.time < hours.close;
}

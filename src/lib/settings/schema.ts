import { z } from "zod";
import { normaliseMsisdn } from "@/lib/domain/contact";

/**
 * Every site setting: its type, validation and default. Stored one row per key in `public.settings`
 * (value is jsonb). Single source of truth, like Settings::schema() in the WordPress build:
 * the admin form, the defaults and the validation all come from here.
 *
 * Message placeholders: {store} store name, {product} product name, {url} product link, {order} order number.
 */

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");
const phone = z
  .string()
  .transform((v, ctx) => {
    const msisdn = normaliseMsisdn(v);
    if (!msisdn) {
      ctx.addIssue({ code: "custom", message: "Enter a Kenyan mobile number, e.g. 0712 345 678" });
      return z.NEVER;
    }
    return msisdn;
  });
const text = (fallback: string) => z.string().trim().min(1).default(fallback);
const longText = z.string().trim().default("");

export const settingsFields = {
  // Contact and hours
  store_name: text("Afya Corner"),
  store_address: text("Afya Plaza, Kilimani, Nairobi"),
  whatsapp_number: phone.default("254700000000"),
  call_number: text("0700 000 000"),
  public_email: z.union([z.literal(""), z.email()]).default(""),
  maps_url: z.union([z.literal(""), z.url({ protocol: /^https$/ })]).default(""),
  open_time: time.default("08:00"),
  close_time: time.default("21:00"),
  // ISO weekdays, 1 = Monday … 7 = Sunday. Unknown days are dropped rather than rejected.
  open_days: z
    .array(z.coerce.number().int())
    .transform((days) => [...new Set(days.filter((d) => d >= 1 && d <= 7))].sort((a, b) => a - b))
    .default([1, 2, 3, 4, 5, 6, 7]),
  after_hours_note: text("Our pharmacists reply from 8:00 AM. You can still send your message now."),

  // Prescriptions
  hide_rx_price: z.boolean().default(true),
  rx_price_label: text("Price on consultation"),
  consult_message: text("Hello {store}, I would like to ask a pharmacist about {product} ({url})."),

  // Messages
  general_message: text("Hello {store}, I have a question."),
  stock_message: text("Hello {store}, is {product} available? ({url})"),
  order_intro: text("Hello {store}, I would like to confirm my order #{order}."),
  thankyou_text: text(
    "Your order is saved. To confirm it, send it to our pharmacist on WhatsApp or give us a call. You pay on delivery or at pick-up.",
  ),
  p_medicine_notice: text(
    "Your cart contains pharmacy-only medicines. A pharmacist will contact you to confirm before dispatch.",
  ),
  search_placeholder: text("Search medicines, vitamins, baby care…"),

  // Home page
  hero_title: text("Your neighbourhood pharmacy, online"),
  hero_text: text(
    "Order medicines, vitamins, skin care and baby essentials. Our pharmacists are a WhatsApp message away.",
  ),
  hero_button: text("Shop now"),
  hero_image_path: z.string().default(""),
  trust_points: z
    .array(z.string().trim())
    .transform((lines) => lines.filter(Boolean))
    .default([
      "Advice from registered pharmacists",
      "Delivery across Nairobi, or pick up in Kilimani",
      "Pay on delivery with M-Pesa or cash",
    ]),
  categories_title: text("Shop by category"),
  featured_title: text("Popular right now"),
  featured_count: z.coerce.number().int().transform((n) => Math.max(0, Math.min(24, n))).default(8),
  consult_title: text("Not sure what you need?"),
  consult_text: text(
    "Chat with our pharmacist on WhatsApp or give us a call. We are happy to help, including with prescription medicines.",
  ),

  // Page content (blank line = new paragraph). May be empty: the section then shows nothing.
  about_text: longText,
  delivery_intro: longText,
  delivery_times: longText,
  terms_text: longText,
  privacy_text: longText,
} as const;

export const settingsSchema = z
  .object(settingsFields)
  .refine((s) => s.open_time < s.close_time, {
    message: "Closing time must be after opening time",
    path: ["close_time"],
  });

export type Settings = z.infer<typeof settingsSchema>;
export type SettingKey = keyof typeof settingsFields;

export const settingKeys = Object.keys(settingsFields) as SettingKey[];

/** All defaults, e.g. for a fresh database or tests. */
export const defaultSettings: Settings = settingsSchema.parse({});

/**
 * Build Settings from `settings` table rows. Forgiving on read: a missing or invalid value falls
 * back to its default (the site must render even if a row is bad); invalid hours fall back as a pair.
 * Saving from the admin (M4) uses settingsSchema strictly instead.
 */
export function settingsFromRows(rows: ReadonlyArray<{ key: string; value: unknown }>): Settings {
  const out: Record<string, unknown> = { ...defaultSettings };
  for (const { key, value } of rows) {
    if (!(key in settingsFields)) continue;
    const parsed = settingsFields[key as SettingKey].safeParse(value);
    if (parsed.success) out[key] = parsed.data;
  }
  const settings = out as Settings;
  if (settings.open_time >= settings.close_time) {
    settings.open_time = defaultSettings.open_time;
    settings.close_time = defaultSettings.close_time;
  }
  return settings;
}

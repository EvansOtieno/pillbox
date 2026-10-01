import type { SettingKey } from "./schema";

/**
 * How each setting appears in the admin: which tab, label, input type and help text.
 * Validation stays in schema.ts; this file is only presentation. Every key in the schema is listed here
 * (a unit test checks it), so a new setting can't be forgotten in the admin.
 */

export type SettingsTab = "contact" | "rx" | "messages" | "home" | "content";
export type FieldType = "text" | "textarea" | "longtext" | "lines" | "phone" | "time" | "days" | "checkbox" | "email" | "url" | "number";

export interface SettingField {
  key: SettingKey;
  tab: SettingsTab;
  label: string;
  type: FieldType;
  help?: string;
}

export const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "contact", label: "Contact and hours" },
  { id: "rx", label: "Prescriptions" },
  { id: "messages", label: "Messages" },
  { id: "home", label: "Home page" },
  { id: "content", label: "Page text" },
];

export const SETTING_FIELDS: SettingField[] = [
  { key: "store_name", tab: "contact", label: "Pharmacy name", type: "text" },
  { key: "store_address", tab: "contact", label: "Address", type: "text", help: "Shown in the footer, on Contact and in pick-up messages." },
  { key: "whatsapp_number", tab: "contact", label: "WhatsApp number", type: "phone", help: "Kenyan mobile, e.g. 0712 345 678." },
  { key: "call_number", tab: "contact", label: "Phone number for calls", type: "text", help: "Shown to customers as written here." },
  { key: "public_email", tab: "contact", label: "Public email", type: "email", help: "Leave empty to hide it." },
  { key: "maps_url", tab: "contact", label: "Google Maps link", type: "url", help: "In Google Maps: Share, then Copy link. Must start with https://" },
  { key: "open_time", tab: "contact", label: "Opens at", type: "time" },
  { key: "close_time", tab: "contact", label: "Closes at", type: "time" },
  { key: "open_days", tab: "contact", label: "Open days", type: "days" },
  { key: "after_hours_note", tab: "contact", label: "Message outside opening hours", type: "textarea" },

  { key: "hide_rx_price", tab: "rx", label: "Hide prices of prescription-only products", type: "checkbox" },
  { key: "rx_price_label", tab: "rx", label: "Text shown instead of the price", type: "text" },
  { key: "consult_message", tab: "rx", label: "\"Consult pharmacist\" WhatsApp message", type: "textarea", help: "Placeholders: {store} {product} {url}" },

  { key: "general_message", tab: "messages", label: "WhatsApp button message", type: "textarea", help: "Placeholder: {store}" },
  { key: "stock_message", tab: "messages", label: "Out-of-stock \"Ask a pharmacist\" message", type: "textarea", help: "Placeholders: {store} {product} {url}" },
  { key: "order_intro", tab: "messages", label: "First line of the WhatsApp order message", type: "textarea", help: "Placeholders: {store} {order}" },
  { key: "thankyou_text", tab: "messages", label: "Text on the order confirmation page", type: "textarea" },
  { key: "p_medicine_notice", tab: "messages", label: "Notice when the cart has pharmacy-only medicines", type: "textarea" },
  { key: "search_placeholder", tab: "messages", label: "Search box hint", type: "text" },

  { key: "hero_title", tab: "home", label: "Headline", type: "text" },
  { key: "hero_text", tab: "home", label: "Introduction", type: "textarea" },
  { key: "hero_button", tab: "home", label: "Main button label", type: "text" },
  { key: "hero_image_path", tab: "home", label: "Hero image path", type: "text", help: "Not shown yet: reserved for a later milestone." },
  { key: "trust_points", tab: "home", label: "Why choose us", type: "lines", help: "One point per line." },
  { key: "categories_title", tab: "home", label: "Categories heading", type: "text" },
  { key: "featured_title", tab: "home", label: "Featured products heading", type: "text" },
  { key: "featured_count", tab: "home", label: "Number of featured products", type: "number", help: "0 to 24." },
  { key: "consult_title", tab: "home", label: "Pharmacist section heading", type: "text" },
  { key: "consult_text", tab: "home", label: "Pharmacist section text", type: "textarea" },

  { key: "about_text", tab: "content", label: "About us", type: "longtext", help: "A blank line starts a new paragraph." },
  { key: "delivery_intro", tab: "content", label: "Delivery page introduction", type: "longtext" },
  { key: "delivery_times", tab: "content", label: "Delivery times and cut-off", type: "longtext" },
  { key: "terms_text", tab: "content", label: "Terms of service", type: "longtext" },
  { key: "privacy_text", tab: "content", label: "Privacy policy", type: "longtext" },
];

/** Read one field's raw value from the submitted form, in the shape its zod schema expects. */
export function readField(field: SettingField, form: FormData): unknown {
  const raw = form.get(field.key);
  switch (field.type) {
    case "checkbox":
      return raw === "on";
    case "days":
      return form.getAll(field.key).map(Number);
    case "lines":
      return String(raw ?? "").split(/\r?\n/);
    case "number":
      return String(raw ?? "").trim();
    default:
      return String(raw ?? "");
  }
}

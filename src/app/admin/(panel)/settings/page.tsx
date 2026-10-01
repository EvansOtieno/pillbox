import type { Metadata } from "next";
import Link from "next/link";
import { AdminForm, FieldError, SaveButton } from "@/components/admin/admin-form";
import { AdminHeading, INPUT, LABEL } from "@/components/admin/ui";
import { requireOwner } from "@/lib/admin/auth";
import { SETTINGS_TABS, SETTING_FIELDS, type SettingField, type SettingsTab } from "@/lib/settings/fields";
import { settingsFromRows, type Settings } from "@/lib/settings/schema";
import { saveSettings } from "./actions";

export const metadata: Metadata = { title: "Settings" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const { supabase } = await requireOwner();
  const requested = (await searchParams).tab;
  const tab: SettingsTab = SETTINGS_TABS.some((t) => t.id === requested) ? (requested as SettingsTab) : "contact";
  // Read live rows (not the storefront cache), so the form always shows what's saved.
  const { data } = await supabase.from("settings").select("key, value");
  const settings = settingsFromRows(data ?? []);

  return (
    <>
      <AdminHeading title="Settings" />
      <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4">
        {SETTINGS_TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/settings?tab=${t.id}`}
            aria-current={t.id === tab ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold ${
              t.id === tab ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* key: switching tabs gives a fresh form (no leftover "Saved" from another tab) */}
      <AdminForm key={tab} action={saveSettings.bind(null, tab)} className="max-w-3xl space-y-6" aria-label={`${tab} settings`}>
        {SETTING_FIELDS.filter((f) => f.tab === tab).map((field) => (
          <SettingInput key={field.key} field={field} settings={settings} />
        ))}
        <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur">
          <SaveButton />
        </div>
      </AdminForm>
    </>
  );
}

function SettingInput({ field, settings }: { field: SettingField; settings: Settings }) {
  const value = settings[field.key];
  const id = field.key;
  const help = field.help && <p className="-mt-0.5 mb-1 text-sm text-muted">{field.help}</p>;

  if (field.type === "checkbox") {
    return (
      <label className="flex min-h-11 items-center gap-3 font-bold">
        <input type="checkbox" name={id} defaultChecked={Boolean(value)} className="size-5 accent-brand" />
        {field.label}
      </label>
    );
  }
  if (field.type === "days") {
    const days = value as number[];
    return (
      <fieldset>
        <legend className={LABEL}>{field.label}</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day, i) => (
            <label key={day} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 has-checked:border-brand has-checked:bg-mist">
              <input type="checkbox" name={id} value={i + 1} defaultChecked={days.includes(i + 1)} className="size-4 accent-brand" />
              {day}
            </label>
          ))}
        </div>
        <FieldError name={id} />
      </fieldset>
    );
  }

  let control: React.ReactNode;
  switch (field.type) {
    case "textarea":
    case "longtext":
    case "lines":
      control = (
        <textarea
          id={id}
          name={id}
          rows={field.type === "longtext" ? 10 : field.type === "lines" ? 4 : 3}
          defaultValue={Array.isArray(value) ? value.join("\n") : String(value)}
          className={INPUT}
        />
      );
      break;
    case "time":
      control = <input id={id} name={id} type="time" defaultValue={String(value)} className={`${INPUT} w-40`} />;
      break;
    case "number":
      control = <input id={id} name={id} inputMode="numeric" defaultValue={String(value)} className={`${INPUT} w-28`} />;
      break;
    case "phone":
      control = <input id={id} name={id} type="tel" inputMode="tel" defaultValue={String(value)} className={`${INPUT} max-w-sm`} />;
      break;
    default:
      control = (
        <input
          id={id}
          name={id}
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          defaultValue={String(value)}
          className={INPUT}
        />
      );
  }
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {field.label}
      </label>
      {help}
      {control}
      <FieldError name={id} />
    </div>
  );
}

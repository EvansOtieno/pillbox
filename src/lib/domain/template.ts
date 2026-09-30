/**
 * Replace {placeholders} in a settings text. Unknown placeholders are left as they are,
 * so a typo in the admin shows up visibly instead of silently disappearing.
 */
export function fillTemplate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{([a-z_]+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match,
  );
}

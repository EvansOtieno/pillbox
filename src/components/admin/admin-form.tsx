"use client";

import { createContext, startTransition, useActionState, useContext, type ReactNode } from "react";
import type { ActionResult } from "@/lib/admin/action-result";

/*
 * Every admin edit form: calls a Server Action, shows "Saving…" while it runs, then "Saved" or the
 * error next to the button (and per-field errors beside their fields). Submitted with a transition
 * rather than the action prop, so React doesn't reset what was typed when a save is rejected.
 */

type Action = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;

const FormState = createContext<{ result: ActionResult | null; pending: boolean }>({ result: null, pending: false });

export function AdminForm({
  action,
  children,
  className,
  confirm,
  "aria-label": ariaLabel,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  /** Ask before submitting (deletes and other irreversible actions). */
  confirm?: string;
  "aria-label"?: string;
}) {
  const [result, formAction, pending] = useActionState(action, null);
  return (
    <FormState value={{ result, pending }}>
      <form
        // Before hydration (slow phone, JS still loading) a click still posts to the Server Action.
        // Once hydrated, onSubmit below takes over and preventDefault stops the native submit.
        // Forms that must ask first (cancel, delete) wait for JavaScript, so nothing skips the question.
        action={confirm ? undefined : formAction}
        noValidate
        aria-label={ariaLabel}
        aria-busy={pending}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (confirm && !window.confirm(confirm)) return;
          const data = new FormData(e.currentTarget);
          startTransition(() => formAction(data));
        }}
      >
        {children}
      </form>
    </FormState>
  );
}

/** Submit button plus the save status, announced to screen readers. */
export function SaveButton({
  children = "Save changes",
  pendingLabel = "Saving…",
  variant = "primary",
  size = "md",
}: {
  children?: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
}) {
  const { result, pending } = useContext(FormState);
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "border border-line bg-surface hover:border-brand hover:text-brand",
    danger: "border border-rx/40 bg-surface text-rx hover:bg-rx hover:text-white",
  }[variant];
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex items-center justify-center rounded-full font-bold transition active:scale-95 disabled:cursor-wait disabled:opacity-70 ${styles} ${
          size === "sm" ? "h-11 px-4 text-sm" : "h-11 px-5"
        }`}
      >
        {pending ? pendingLabel : children}
      </button>
      <span role="status" className="text-sm font-bold">
        {!pending && result && (
          // key replays the fade-in for each new result
          <span key={result.at} className={`admin-status ${result.ok ? "text-brand" : "text-rx"}`}>
            {result.ok ? `✓ ${result.message}` : result.message}
          </span>
        )}
      </span>
    </span>
  );
}

/** Error for one field from the last result, if any. */
export function FieldError({ name, id }: { name: string; /** Unique id when several forms share a page. */ id?: string }) {
  const { result } = useContext(FormState);
  const message = result && !result.ok ? result.fieldErrors?.[name] : undefined;
  return message ? (
    <p id={id ?? `${name}-error`} className="mt-1 text-sm font-bold text-rx">
      {message}
    </p>
  ) : null;
}

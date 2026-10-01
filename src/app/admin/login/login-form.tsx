"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "../auth-actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, {} as SignInState);
  return (
    <form action={action} className="space-y-5" aria-describedby={state.error ? "login-error" : undefined}>
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p id="login-error" role="alert" className="rounded-xl border border-rx/30 bg-rx-bg p-3 text-sm font-bold text-rx">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block font-bold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base focus-visible:border-brand"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block font-bold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base focus-visible:border-brand"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-brand font-bold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

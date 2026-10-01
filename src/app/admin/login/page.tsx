import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CrossIcon } from "@/components/icons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  "no-access": "This account isn't set up as pharmacy staff. Ask the owner to add you.",
  "signed-out": "You're signed out.",
};

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-8">
        <div className="flex items-center gap-2">
          <CrossIcon className="size-7 text-cross" />
          <span className="text-lg font-extrabold tracking-tight">Afya Corner</span>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Staff sign in</h1>
        <Suspense>
          <Notice searchParams={searchParams} />
        </Suspense>
        <div className="mt-6">
          <Suspense>
            <Form searchParams={searchParams} />
          </Suspense>
        </div>
        <Link href="/" className="mt-6 inline-block text-sm text-muted underline hover:text-brand">
          Back to the shop
        </Link>
      </div>
    </main>
  );
}

async function Notice({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const params = await searchParams;
  const key = params.error === "no-access" ? "no-access" : "signed-out" in params ? "signed-out" : null;
  return key ? <p className="mt-3 text-sm text-muted">{NOTICES[key]}</p> : null;
}

async function Form({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : "/admin"} />;
}

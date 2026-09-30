import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">We can&apos;t find that page</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        The product may have been renamed or removed. Search for it, or browse the shop.
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-5 font-bold text-white transition hover:bg-brand-dark"
      >
        Browse the shop
      </Link>
    </div>
  );
}

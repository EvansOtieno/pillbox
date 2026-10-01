// Shown while an admin page loads its (always fresh, per-user) data.
export default function AdminLoading() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-mist motion-reduce:animate-none" />
      <div className="h-80 animate-pulse rounded-2xl bg-mist motion-reduce:animate-none" />
    </div>
  );
}

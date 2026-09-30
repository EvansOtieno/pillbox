/** Shown in the prerendered shell while request-specific results stream in. */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl border border-line bg-surface motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-mist motion-reduce:animate-none" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-mist motion-reduce:animate-none" />
      <div className="mt-8">
        <GridSkeleton count={4} />
      </div>
    </div>
  );
}

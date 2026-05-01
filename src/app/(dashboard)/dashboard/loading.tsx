import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPageLoading() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      {/* Metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
            </div>
          </div>
        ))}
      </section>

      {/* Main content grid */}
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Work items */}
        <div className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="mt-5 grid gap-3 sm:mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid gap-4 rounded-2xl border border-border bg-muted/25 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="mt-5 grid gap-3 sm:mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

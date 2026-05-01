import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Sidebar skeleton */}
      <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="border-b border-border px-4 py-4 lg:px-5 lg:py-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
        <nav className="min-h-0 flex-1 overflow-hidden px-3 py-4">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20 ml-3" />
                <div className="space-y-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
        <div className="border-t border-border px-4 py-4 lg:px-5 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Header skeleton */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:px-6 lg:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 lg:hidden" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-6 w-px" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        </header>

        {/* Page content skeleton */}
        <main className="flex-1 bg-linear-to-b from-background via-muted/30 to-background px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
          <div className="space-y-5 sm:space-y-6">
            {/* Page title */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>

            {/* Content cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5"
                >
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>

            {/* Table/content area */}
            <div className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-9 w-48" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

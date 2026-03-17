export default function GoalsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded bg-muted animate-pulse" />
        <div className="h-6 w-24 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 rounded bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-32 rounded bg-muted animate-pulse" />
              <div className="h-5 w-16 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-2.5 rounded-full bg-muted animate-pulse" />
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

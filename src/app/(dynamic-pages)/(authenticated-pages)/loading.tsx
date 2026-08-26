export default function AuthenticatedLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6" aria-label="Loading page" role="status">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full rounded bg-muted/70" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 rounded-xl border bg-muted/30" />
          <div className="h-28 rounded-xl border bg-muted/30" />
          <div className="h-28 rounded-xl border bg-muted/30" />
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-14 rounded-lg bg-muted/40" />
          <div className="h-14 rounded-lg bg-muted/40" />
          <div className="h-14 rounded-lg bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

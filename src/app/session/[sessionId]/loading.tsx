export default function SessionLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-6">
      <div className="w-full animate-pulse space-y-4" aria-label="Loading practice" role="status">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-muted" />
            <div className="h-3.5 w-20 rounded bg-muted/70" />
          </div>
          <div className="h-2 flex-1 rounded-full bg-muted/60" />
        </div>

        <div className="space-y-3 rounded-2xl border p-4 sm:p-6">
          <div className="h-9 w-36 rounded-lg bg-muted/70" />
          <div className="mx-auto h-5 w-4/5 rounded bg-muted" />
          <div className="mx-auto h-5 w-2/3 rounded bg-muted" />
          <div className="mx-auto mt-4 h-[min(38vh,320px)] w-full max-w-3xl rounded-xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

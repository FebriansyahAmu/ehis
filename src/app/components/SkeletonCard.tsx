export default function SkeletonCard() {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-busy="true"
      aria-label="Memuat data..."
    >
      <div className="flex items-start justify-between">
        <div className="animate-skeleton h-10 w-10 rounded-xl bg-slate-200" />
        <div className="animate-skeleton h-5 w-14 rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 animate-skeleton h-8 w-24 rounded-lg bg-slate-200" />
      <div className="mt-2 animate-skeleton h-4 w-36 rounded bg-slate-200" />
      <div className="mt-1 animate-skeleton h-3 w-20 rounded bg-slate-100" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      aria-busy="true"
      aria-label="Memuat tabel..."
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="animate-skeleton h-5 w-36 rounded-lg bg-slate-200" />
        <div className="animate-skeleton h-4 w-20 rounded bg-slate-200" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="animate-skeleton h-4 w-24 rounded bg-slate-200" />
            <div className="animate-skeleton h-4 w-32 rounded bg-slate-200" />
            <div className="ml-auto animate-skeleton h-5 w-20 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      <div className="mb-8">
        <span className="bf-skeleton h-7 w-32 block" />
        <span className="bf-skeleton h-4 w-64 block mt-2" />
      </div>

      {/* Current plan card */}
      <div className="bf-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <span className="bf-skeleton h-3 w-24 block" />
            <span className="bf-skeleton h-6 w-40 block" />
            <span className="bf-skeleton h-4 w-56 block" />
          </div>
          <span className="bf-skeleton h-9 w-44" />
        </div>
      </div>

      {/* Usage cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bf-card p-6 space-y-3">
            <span className="bf-skeleton h-3 w-24 block" />
            <span className="bf-skeleton h-7 w-32 block" />
            <span className="bf-skeleton h-2 w-full block" />
            <span className="bf-skeleton h-3 w-40 block" />
          </div>
        ))}
      </div>

      {/* Plan selector */}
      <div className="grid md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bf-card p-6 space-y-3">
            <span className="bf-skeleton h-5 w-28 block" />
            <span className="bf-skeleton h-3 w-40 block" />
            <span className="bf-skeleton h-8 w-24 block" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j} className="bf-skeleton h-3 w-full block" />
              ))}
            </div>
            <span className="bf-skeleton h-9 w-full block mt-3" />
          </div>
        ))}
      </div>
    </>
  )
}

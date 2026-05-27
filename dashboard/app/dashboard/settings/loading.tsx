export default function Loading() {
  return (
    <>
      <div className="mb-8">
        <span className="bf-skeleton h-7 w-32 block" />
        <span className="bf-skeleton h-4 w-72 block mt-2" />
      </div>

      {/* Tab strip */}
      <div className="flex gap-2 mb-6">
        <span className="bf-skeleton h-9 w-28" />
        <span className="bf-skeleton h-9 w-28" />
      </div>

      {/* Tab body */}
      <div className="bf-card p-6 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <span className="bf-skeleton h-3 w-32 block" />
            <span className="bf-skeleton h-10 w-full block" />
          </div>
        ))}
        <span className="bf-skeleton h-9 w-32 block mt-3" />
      </div>
    </>
  )
}

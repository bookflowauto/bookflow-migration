export default function Loading() {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <span className="bf-skeleton h-7 w-32 block" />
            <span className="bf-skeleton h-4 w-48 block mt-2" />
          </div>
          <span className="bf-skeleton h-9 w-40" />
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="bf-skeleton h-8 w-9" />
            <span className="bf-skeleton h-8 w-16" />
            <span className="bf-skeleton h-8 w-9" />
          </div>
          <span className="bf-skeleton h-9 w-44" />
        </div>
      </div>

      {/* Grid */}
      <div className="bf-card overflow-hidden">
        <div className="grid border-b" style={{ gridTemplateColumns: '64px repeat(7, 1fr)', borderColor: 'var(--border)' }}>
          <div />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="text-center py-3" style={{ borderLeft: '1px solid var(--border)' }}>
              <span className="bf-skeleton h-3 w-8 inline-block" />
              <span className="bf-skeleton h-5 w-5 inline-block mt-1.5" />
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: '64px repeat(7, 1fr)', height: 13 * 56 }}>
          <div />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="relative p-2" style={{ borderLeft: '1px solid var(--border)' }}>
              {i % 2 === 0 && <span className="bf-skeleton block h-10 w-full mt-12" />}
              {i % 3 === 0 && <span className="bf-skeleton block h-14 w-full mt-32" />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

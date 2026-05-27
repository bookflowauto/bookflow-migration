export default function Loading() {
  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <span className="bf-skeleton h-7 w-32 block" />
        <span className="bf-skeleton h-4 w-72 block mt-2" />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bf-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="bf-skeleton bf-skeleton-circle w-1.5 h-1.5" />
              <span className="bf-skeleton h-3 w-24" />
            </div>
            <span className="bf-skeleton h-8 w-12 block" />
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bf-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="bf-skeleton h-4 w-28" />
          <span className="bf-skeleton h-3 w-20" />
        </div>
        <ul>
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="bf-skeleton bf-skeleton-circle w-9 h-9 shrink-0" />
                <div className="min-w-0 space-y-1.5">
                  <span className="bf-skeleton h-4 w-40 block" />
                  <span className="bf-skeleton h-3 w-20 block" />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="bf-skeleton h-5 w-20" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

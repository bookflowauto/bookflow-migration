export default function Loading() {
  return (
    <>
      {/* Back link */}
      <span className="bf-skeleton h-4 w-24 block mb-6" />

      {/* Patient header card */}
      <div className="bf-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <span className="bf-skeleton bf-skeleton-circle w-14 h-14 shrink-0" />
            <div className="min-w-0 space-y-2">
              <span className="bf-skeleton h-6 w-48 block" />
              <span className="bf-skeleton h-3 w-20 block" />
              <div className="flex gap-4 mt-2">
                <span className="bf-skeleton h-4 w-36" />
                <span className="bf-skeleton h-4 w-28" />
              </div>
            </div>
          </div>
          <span className="bf-skeleton h-6 w-24" />
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bf-card p-4">
            <span className="bf-skeleton h-3 w-20 block" />
            <span className="bf-skeleton h-7 w-10 block mt-2" />
          </div>
        ))}
      </div>

      {/* Clinical summary */}
      <div className="bf-card p-6 mb-6 space-y-2">
        <span className="bf-skeleton h-3 w-40 block mb-3" />
        <span className="bf-skeleton h-4 w-full block" />
        <span className="bf-skeleton h-4 w-11/12 block" />
        <span className="bf-skeleton h-4 w-9/12 block" />
        <span className="bf-skeleton h-4 w-10/12 block" />
      </div>

      {/* Appointments */}
      <div className="bf-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="bf-skeleton h-4 w-28" />
          <span className="bf-skeleton h-3 w-12" />
        </div>
        <ul>
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <span className="bf-skeleton h-4 w-44 block" />
                <span className="bf-skeleton h-3 w-32 block" />
              </div>
              <span className="bf-skeleton h-5 w-20" />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

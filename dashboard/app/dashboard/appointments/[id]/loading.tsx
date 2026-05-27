export default function Loading() {
  return (
    <>
      {/* Back link */}
      <span className="bf-skeleton h-4 w-32 block mb-6" />

      {/* Header card */}
      <div className="bf-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <span className="bf-skeleton h-3 w-24 block" />
            <span className="bf-skeleton h-6 w-56 block" />
            <span className="bf-skeleton h-4 w-44 block" />
          </div>
          <div className="flex items-center gap-2">
            <span className="bf-skeleton h-5 w-20" />
            <span className="bf-skeleton h-5 w-20" />
          </div>
        </div>
      </div>

      {/* Two-column */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transcript */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bf-card p-6 space-y-2">
            <span className="bf-skeleton h-3 w-32 block" />
            <span className="bf-skeleton h-3 w-56 block mb-4" />
            <span className="bf-skeleton h-4 w-full block" />
            <span className="bf-skeleton h-4 w-11/12 block" />
            <span className="bf-skeleton h-4 w-10/12 block" />
            <span className="bf-skeleton h-4 w-full block" />
            <span className="bf-skeleton h-4 w-9/12 block" />
            <div className="flex gap-2 pt-4">
              <span className="bf-skeleton h-9 w-32" />
              <span className="bf-skeleton h-9 w-28" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bf-card p-6 space-y-3">
            <span className="bf-skeleton h-3 w-32 block" />
            <span className="bf-skeleton h-4 w-full block" />
            <span className="bf-skeleton h-9 w-full block" />
          </div>
          <div className="bf-card p-6">
            <span className="bf-skeleton h-3 w-20 block mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <span className="bf-skeleton bf-skeleton-circle w-10 h-10" />
              <div className="min-w-0 space-y-1.5">
                <span className="bf-skeleton h-4 w-32 block" />
                <span className="bf-skeleton h-3 w-16 block" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="bf-skeleton h-3 w-12" />
                <span className="bf-skeleton h-3 w-24" />
              </div>
              <div className="flex justify-between">
                <span className="bf-skeleton h-3 w-12" />
                <span className="bf-skeleton h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

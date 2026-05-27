import Image from 'next/image'

export default function ConfirmedDonePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="BookFlow" width={56} height={56} className="mb-3" priority />
        </div>

        <div className="bf-card p-8">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Το ραντεβού επιβεβαιώθηκε
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Σας ευχαριστούμε. Τα λέμε σύντομα.
          </p>
        </div>
      </div>
    </main>
  )
}

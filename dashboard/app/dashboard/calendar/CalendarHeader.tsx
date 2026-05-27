'use client'

import { useT } from '@/lib/i18n/client'
import { type CalendarView, formatRangeLabel } from './utils'

type Props = {
  view: CalendarView
  anchor: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (v: CalendarView) => void
}

export default function CalendarHeader({
  view,
  anchor,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: Props) {
  const { t, bcp } = useT()

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            {t('calendar.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {formatRangeLabel(view, anchor, bcp)}
          </p>
        </div>

        {/* + New (disabled, GCal-driven for now) */}
        <button
          type="button"
          disabled
          title={t('calendar.newDisabledTooltip')}
          className="bf-btn-primary inline-flex items-center gap-1.5"
          style={{ opacity: 0.5, cursor: 'not-allowed' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('calendar.new')}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Prev / Today / Next */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label={t('calendar.prev')}
            className="bf-btn-secondary px-2.5 py-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button type="button" onClick={onToday} className="bf-btn-secondary text-xs">
            {t('calendar.today')}
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={t('calendar.next')}
            className="bf-btn-secondary px-2.5 py-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* View toggle */}
        <div
          role="tablist"
          aria-label={t('calendar.viewAria')}
          className="inline-flex p-0.5 rounded-lg"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          {(['day', 'week', 'month'] as const).map(v => {
            const active = v === view
            const label =
              v === 'day' ? t('calendar.view.day')
                : v === 'week' ? t('calendar.view.week')
                : t('calendar.view.month')
            return (
              <button
                key={v}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onViewChange(v)}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                style={{
                  background: active ? 'var(--surface)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

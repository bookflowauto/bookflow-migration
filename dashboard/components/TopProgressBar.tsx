'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Global indeterminate progress bar that appears at the top of the viewport
 * while client-side navigation is pending. Visible after a short delay so
 * fast transitions don't flash.
 */
export default function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)
    showTimerRef.current = null
    safetyTimerRef.current = null
    setVisible(false)
  }

  const start = () => {
    if (showTimerRef.current || visible) return
    // Delay so quick navigations don't flash the bar
    showTimerRef.current = setTimeout(() => setVisible(true), 120)
    // Safety: never leave it visible forever
    safetyTimerRef.current = setTimeout(() => stop(), 15000)
  }

  // Detect internal link clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      if (anchor.dataset.noProgress === 'true') return

      const href = anchor.getAttribute('href')
      if (!href) return
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      // External absolute URL?
      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        // Same URL, no nav
        if (url.pathname === window.location.pathname && url.search === window.location.search) return
      } catch {
        return
      }

      start()
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stop the bar whenever the route resolves
  useEffect(() => {
    stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div className="bf-progress-bar" aria-hidden>
      <div className="bf-progress-bar__fill" />
    </div>
  )
}

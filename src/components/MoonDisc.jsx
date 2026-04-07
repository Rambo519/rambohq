import { useId } from 'react'

/** Lit disc from the right (waxing); swap gradient in mapper if API gives phase angle. */
export function MoonDisc({ illumination, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `hqMoonGrad-${uid}`
  const pct = Math.round(illumination * 100)
  const angle = illumination * 180

  return (
    <div
      className={`hq-moon-disc ${className}`.trim()}
      role="img"
      aria-label={`Moon about ${pct} percent illuminated`}
    >
      <svg viewBox="0 0 64 64" className="hq-moon-disc__svg" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--hq-moon-dark)" />
            <stop offset={`${angle / 1.8}%`} stopColor="var(--hq-moon-dark)" />
            <stop offset={`${angle / 1.8}%`} stopColor="var(--hq-moon-lit)" />
            <stop offset="100%" stopColor="var(--hq-moon-lit)" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="26" fill={`url(#${gradId})`} />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="var(--hq-border-strong)"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}

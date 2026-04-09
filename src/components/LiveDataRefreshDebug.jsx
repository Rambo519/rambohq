import { useDashboardLive } from '../hooks/useDashboardLive'

function fmt(ts) {
  if (ts == null) return '—'
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

/** Temporary: refresh timestamps for testing auto-refresh; remove before ship. */
export function LiveDataRefreshDebug() {
  const { liveRefreshAt } = useDashboardLive()

  return (
    <div
      className="hq-refresh-debug"
      aria-hidden
      title="Last successful refresh (local 12h time) — temporary debug"
    >
      <span className="hq-refresh-debug__label">live</span>
      <span className="hq-refresh-debug__row">
        <strong>wx</strong> {fmt(liveRefreshAt.weatherPath)}
      </span>
      <span className="hq-refresh-debug__row">
        <strong>moon</strong> {fmt(liveRefreshAt.astronomy)}
      </span>
      <span className="hq-refresh-debug__row">
        <strong>mkt</strong> {fmt(liveRefreshAt.market)}
      </span>
      <span className="hq-refresh-debug__row">
        <strong>spo</strong> {fmt(liveRefreshAt.sports)}
      </span>
    </div>
  )
}

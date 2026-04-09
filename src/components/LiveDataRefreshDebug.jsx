import { useDashboardLive } from '../hooks/useDashboardLive'

function fmt(ts) {
  if (ts == null) return '—'
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/** Mount only when `import.meta.env.DEV` (see App.jsx). */
export function LiveDataRefreshDebug() {
  const { liveRefreshAt } = useDashboardLive()

  return (
    <div
      className="hq-refresh-debug"
      aria-hidden
      title="DEV: last successful refresh (local time)"
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

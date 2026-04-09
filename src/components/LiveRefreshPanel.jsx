import { useEffect, useState } from 'react'
import { DashboardCard } from './DashboardCard'
import { IconActivity } from './Icons'
import { useDashboardLive } from '../hooks/useDashboardLive'

const MIN = 60_000
const HR = 60 * MIN
const DAY = 24 * HR

/** Discrete freshness tiers for telemetry display (not literal clock times). */
function freshness(ts, now) {
  if (ts == null || !Number.isFinite(ts)) return { text: 'stale', tone: 'stale' }
  const diff = Math.max(0, now - ts)
  if (diff < 2 * MIN) return { text: 'just now', tone: 'now' }
  if (diff < HR) return { text: '5 min ago', tone: 'min' }
  if (diff < DAY) return { text: '1 hr ago', tone: 'hr' }
  return { text: 'stale', tone: 'stale' }
}

/** Last successful refresh times per live-data source (shared provider). */
export function LiveRefreshPanel() {
  const { liveRefreshAt } = useDashboardLive()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const wx = freshness(liveRefreshAt.weatherPath, now)
  const moon = freshness(liveRefreshAt.astronomy, now)
  const mkt = freshness(liveRefreshAt.market, now)
  const spo = freshness(liveRefreshAt.sports, now)

  return (
    <DashboardCard
      title={
        <>
          <span className="hq-live-refresh__status" aria-hidden />
          <span className="hq-live-refresh__head-label">LIVE</span>
        </>
      }
      icon={<IconActivity className="hq-ico" />}
      spanClass="hq-span-3"
      className="hq-card--forecast hq-card--live-refresh"
    >
      <div className="hq-live-refresh">
        <p className="hq-live-refresh__times">source freshness</p>
        <div className="hq-live-refresh__row">
          <span className="hq-live-refresh__k">wthr</span>
          <span className="hq-live-refresh__v" data-freshness={wx.tone}>
            {wx.text}
          </span>
        </div>
        <div className="hq-live-refresh__row">
          <span className="hq-live-refresh__k">moon</span>
          <span className="hq-live-refresh__v" data-freshness={moon.tone}>
            {moon.text}
          </span>
        </div>
        <div className="hq-live-refresh__row">
          <span className="hq-live-refresh__k">mkt</span>
          <span className="hq-live-refresh__v" data-freshness={mkt.tone}>
            {mkt.text}
          </span>
        </div>
        <div className="hq-live-refresh__row">
          <span className="hq-live-refresh__k">spts</span>
          <span className="hq-live-refresh__v" data-freshness={spo.tone}>
            {spo.text}
          </span>
        </div>
      </div>
    </DashboardCard>
  )
}

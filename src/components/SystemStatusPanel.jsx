import { useState, useEffect, useRef } from 'react'
import { DashboardCard } from './DashboardCard'
import { IconActivity } from './Icons'

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

function jitter(scale = 1) {
  return (Math.random() - 0.5) * 2 * scale
}

export function SystemStatusPanel() {
  const [cpu, setCpu] = useState(38)
  const [mem, setMem] = useState(56)
  const [latency, setLatency] = useState(17)
  const [network, setNetwork] = useState(/** @type {'STABLE' | 'ACTIVE'} */ ('STABLE'))
  const t0 = useRef(0)
  const cpuRef = useRef(38)
  const latRef = useRef(17)

  useEffect(() => {
    t0.current = typeof performance !== 'undefined' ? performance.now() : 0
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = (performance.now() - t0.current) / 1000
      const c = clamp(38 + 14 * Math.sin(t * 0.115) + jitter(0.65), 22, 82)
      const m = clamp(53 + 9 * Math.sin(t * 0.075 + 1.12) + jitter(0.5), 45, 73)
      const ci = Math.round(c)
      cpuRef.current = ci
      setCpu(ci)
      setMem(Math.round(m))
      setNetwork(ci > 74 || latRef.current > 34 ? 'ACTIVE' : 'STABLE')
    }, 3200)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = (performance.now() - t0.current) / 1000
      const l = clamp(18 + 6 * Math.sin(t * 0.58 + 0.4) + jitter(2.4), 10, 44)
      const li = Math.round(l)
      latRef.current = li
      setLatency(li)
      setNetwork(cpuRef.current > 74 || li > 34 ? 'ACTIVE' : 'STABLE')
    }, 640)
    return () => window.clearInterval(id)
  }, [])

  return (
    <DashboardCard
      title="System status"
      icon={<IconActivity className="hq-ico" />}
      spanClass="hq-span-4"
      className="hq-card--sys"
    >
      <div className="hq-sys">
        <div className="hq-sys__hud" aria-hidden="true">
          <div className="hq-sys__scan" />
          <div className="hq-sys__ticks">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="hq-sys__tick" />
            ))}
          </div>
        </div>

        <dl className="hq-sys__metrics">
          <div className="hq-sys__row">
            <dt>CPU load</dt>
            <dd>
              <span className="hq-sys__pct">{cpu}%</span>
              <div className="hq-sys__track">
                <span className="hq-sys__fill" style={{ width: `${cpu}%` }} />
              </div>
            </dd>
          </div>
          <div className="hq-sys__row">
            <dt>Memory</dt>
            <dd>
              <span className="hq-sys__pct">{mem}%</span>
              <div className="hq-sys__track">
                <span className="hq-sys__fill hq-sys__fill--mem" style={{ width: `${mem}%` }} />
              </div>
            </dd>
          </div>
          <div className="hq-sys__row">
            <dt>Network</dt>
            <dd>
              <span className={`hq-sys__status ${network === 'ACTIVE' ? 'hq-sys__status--active' : ''}`}>
                <span className="hq-sys__dot" />
                {network}
              </span>
            </dd>
          </div>
          <div className="hq-sys__row">
            <dt>Latency</dt>
            <dd>
              <span className="hq-sys__ms">{latency}</span>
              <span className="hq-sys__unit">ms</span>
            </dd>
          </div>
          <div className="hq-sys__row hq-sys__row--sync">
            <dt>Sync</dt>
            <dd className="hq-sys__sync-dd">
              <span className="hq-sys__sync-pill">
                <span className="hq-sys__dot hq-sys__dot--pulse" />
                SYNCED
              </span>
              <span className="hq-sys__sync-sub">
                <span className="hq-sys__mini-dot" />
                ONLINE
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </DashboardCard>
  )
}

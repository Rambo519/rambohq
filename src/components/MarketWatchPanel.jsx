import { DashboardCard } from './DashboardCard'
import { IconChartLine } from './Icons'
import { formatMarketPrice } from '../utils/formatMarket'
import { useDashboardLive } from '../hooks/useDashboardLive'

function Trend({ direction, changePct, loading }) {
  if (loading) {
    return (
      <span className="hq-market__pct hq-market__pct--flat" aria-hidden>
        …
      </span>
    )
  }
  if (changePct == null || Number.isNaN(changePct)) {
    return <span className="hq-market__pct hq-market__pct--flat">—</span>
  }
  const up = direction === 'up'
  const down = direction === 'down'
  const flat = direction === 'flat' || (!up && !down)
  const cls = flat ? 'hq-market__pct--flat' : up ? 'hq-market__pct--up' : 'hq-market__pct--down'
  const sign = changePct > 0 ? '+' : ''
  return (
    <span className={`hq-market__pct ${cls}`}>
      {!flat && (
        <span className="hq-market__arrow" aria-hidden>
          {up ? '▲' : '▼'}
        </span>
      )}
      {sign}
      {changePct.toFixed(2)}%
    </span>
  )
}

function MarketRow({ r, loading }) {
  return (
    <li className="hq-market__row">
      <div className="hq-market__id">
        <span className="hq-market__sym">{r.symbol}</span>
        <span className="hq-market__name">{r.label}</span>
      </div>
      <div className="hq-market__price">
        <span className="hq-market__num">{formatMarketPrice(r, { loading })}</span>
        {r.suffix && <span className="hq-market__sfx">{r.suffix}</span>}
      </div>
      <Trend direction={r.direction} changePct={r.changePct} loading={loading} />
    </li>
  )
}

function MarketColumn({ rows, side, loading }) {
  const align = side === 'left' ? 'start' : 'end'
  return (
    <div className={`hq-market__mini hq-market__mini--${align}`}>
      <div className="hq-market__head" aria-hidden>
        <span>Instrument</span>
        <span>Last</span>
        <span>1D</span>
      </div>
      <ul className="hq-market__list">
        {rows.map((r) => (
          <MarketRow key={r.id} r={r} loading={loading} />
        ))}
      </ul>
    </div>
  )
}

export function MarketWatchPanel() {
  const { market } = useDashboardLive()
  const { status, rows, errorMessage } = market

  const leftRows = rows.slice(0, 3)
  const rightRows = rows.slice(3)
  const loading = status === 'loading'

  return (
    <DashboardCard title="Market watch" icon={<IconChartLine className="hq-ico" />} spanClass="hq-span-8" className="hq-card--market">
      {status === 'error' && (
        <p className="hq-market__state hq-market__state--err" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="hq-market hq-market--split">
        <MarketColumn rows={leftRows} side="left" loading={loading} />
        <MarketColumn rows={rightRows} side="right" loading={loading} />
      </div>
    </DashboardCard>
  )
}

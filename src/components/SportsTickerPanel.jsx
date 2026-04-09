import { DashboardCard } from './DashboardCard'
import { IconStadium } from './Icons'
import { useDashboardLive } from '../hooks/useDashboardLive'

const ACCENT = {
  guardians: '#e31937',
  cavaliers: '#6f263d',
  browns: '#e35205',
  ufc: '#f1f5f9',
}

function StateBadge({ state }) {
  if (state === 'live') return <span className="hq-cle__live">Live</span>
  if (state === 'final') return <span className="hq-cle__final">Final</span>
  return <span className="hq-cle__sched">Upcoming</span>
}

export function SportsTickerPanel() {
  const { sports } = useDashboardLive()
  const { status, rows, errorMessage } = sports

  return (
    <DashboardCard
      title="Sports ticker"
      icon={<IconStadium className="hq-ico" />}
      spanClass="hq-span-8"
      className="hq-card--sports"
    >
      {status === 'loading' && (
        <p className="hq-cle__state" role="status">
          Loading ticker…
        </p>
      )}

      {status === 'error' && (
        <p className="hq-cle__state hq-cle__state--err" role="alert">
          {errorMessage}
        </p>
      )}

      {status === 'ready' && rows.length > 0 && (
        <ul className="hq-cle hq-ticker">
          {rows.map((g) => {
            const isTeamRow = g.rowKind === 'team'
            return (
              <li
                key={g.id}
                className={isTeamRow ? 'hq-cle__row hq-cle__row--4col' : 'hq-cle__row'}
                style={{ '--cle-accent': ACCENT[g.id] }}
              >
                <div className="hq-cle__team">
                  <span
                    className={
                      g.rowKind === 'ufc'
                        ? 'hq-cle__name hq-cle__name--mma'
                        : 'hq-cle__name'
                    }
                  >
                    {g.teamName}
                  </span>
                  <span className={g.rowKind === 'ufc' ? 'hq-cle__league hq-cle__league--ufc' : 'hq-cle__league'}>
                    {g.league}
                  </span>
                </div>
                <div className="hq-cle__mid hq-cle__mid--ticker">
                  <span className="hq-cle__matchup">{g.matchupLine}</span>
                  <span className="hq-cle__venue">{g.venueLine}</span>
                </div>
                {isTeamRow ? (
                  <>
                    <div className="hq-cle__score hq-cle__score--ticker hq-cle__score--teamcol">
                      <StateBadge state={g.state} />
                      {g.scoreLine ? (
                        <span className="hq-cle__nums">{g.scoreLine}</span>
                      ) : (
                        <span className="hq-cle__nums hq-cle__nums--muted">—</span>
                      )}
                    </div>
                    <div className="hq-cle__next">
                      <span
                        className={
                          g.nextMatchupLine
                            ? 'hq-cle__next-match'
                            : 'hq-cle__next-match hq-cle__next-match--placeholder'
                        }
                      >
                        {g.nextMatchupLine ?? '—'}
                      </span>
                      <span
                        className={
                          g.nextTimeLine
                            ? 'hq-cle__next-when'
                            : 'hq-cle__next-when hq-cle__next-when--placeholder'
                        }
                      >
                        {g.nextTimeLine ?? '—'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="hq-cle__score hq-cle__score--ticker">
                    <span className="hq-cle__eventdate">{g.dateDisplay || '—'}</span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </DashboardCard>
  )
}

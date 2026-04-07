export function DashboardHeader() {
  return (
    <header className="hq-header">
      <div className="hq-header__hud" aria-hidden="true">
        <div className="hq-header__hud-grid" />
        <div className="hq-header__hud-scan" />
        <div className="hq-header__hud-rule hq-header__hud-rule--top" />
        <div className="hq-header__hud-rule hq-header__hud-rule--bottom" />
      </div>
      <div className="hq-header__glow" aria-hidden="true" />
      <div className="hq-header__inner">
        <div className="hq-header__chrome" aria-hidden="true">
          <div className="hq-header__micro">
            <span className="hq-header__micro-bit">UPLINK · STABLE</span>
            <span className="hq-header__micro-bit hq-header__micro-bit--mid">RELAY · 01</span>
            <span className="hq-header__micro-bit">LAT · SYNC</span>
          </div>
          <div className="hq-header__led-row">
            <span className="hq-header__led" />
            <span className="hq-header__led" />
            <span className="hq-header__led hq-header__led--pulse" />
            <span className="hq-header__led" />
            <span className="hq-header__led" />
          </div>
          <div className="hq-header__bars" role="presentation">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="hq-header__bar" />
            ))}
          </div>
          <div className="hq-header__wave-wrap">
            <svg
              className="hq-header__wave"
              viewBox="0 0 480 20"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="hq-header__wave-path"
                d="M0 10 L40 10 L48 4 L56 14 L64 6 L72 12 L80 10 L480 10"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h1 className="hq-header__title">
          <span className="hq-header__title-main">Rambo//HQ</span>{' '}
          <span className="hq-header__baker-net">[BAKER-NET]</span>
        </h1>
        <p className="hq-header__tagline">
          <span className="hq-header__subtitle">Personal Command Center</span>
          <span className="hq-header__sep" aria-hidden="true">
            //
          </span>
          <span className="hq-header__status">REL-7.41.02</span>
          <span className="hq-header__sep" aria-hidden="true">
            //
          </span>
          <span className="hq-header__live" role="status">
            <span className="hq-header__live-dot" aria-hidden="true" />
            <span className="hq-header__live-text">SYS.ONLINE</span>
          </span>
        </p>
      </div>
    </header>
  )
}

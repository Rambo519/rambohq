export function DashboardCard({ title, icon, children, className = '', spanClass = '' }) {
  return (
    <article className={`hq-card ${spanClass} ${className}`.trim()}>
      <header className="hq-card__head">
        {icon && <span className="hq-card__icon">{icon}</span>}
        <h2 className="hq-card__title">{title}</h2>
      </header>
      <div className="hq-card__body">{children}</div>
    </article>
  )
}

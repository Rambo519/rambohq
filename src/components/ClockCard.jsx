import { useState, useEffect } from 'react'
import { DashboardCard } from './DashboardCard'
import { IconClock } from './Icons'

function formatTime(d) {
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

function formatDateLong(d) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ClockCard() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <DashboardCard
      title="Local time"
      icon={<IconClock className="hq-ico" />}
      spanClass="hq-span-4"
      className="hq-card--clock"
    >
      <div className="hq-clock">
        <time className="hq-clock__time" dateTime={now.toISOString()}>
          {formatTime(now)}
        </time>
        <time className="hq-clock__date" dateTime={now.toISOString().slice(0, 10)}>
          {formatDateLong(now)}
        </time>
      </div>
    </DashboardCard>
  )
}

/** Format a Date or ISO string for compact local clock display (matches dashboard style). */
export function formatTimeLocal(input) {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDayLengthFromSeconds(seconds) {
  const totalMin = Math.round(Number(seconds) / 60)
  if (!Number.isFinite(totalMin) || totalMin < 0) return null
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m}m`
}

/**
 * @param {{ price: number | null }} row
 * @param {{ loading?: boolean }} [opts]
 */
export function formatMarketPrice(row, opts = {}) {
  const { loading = false } = opts
  if (row.price == null || Number.isNaN(row.price)) {
    return loading ? '…' : '—'
  }
  const p = row.price
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (p >= 100) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return p.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

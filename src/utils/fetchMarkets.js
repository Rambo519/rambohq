import { MARKET_INSTRUMENTS, MARKET_INSTRUMENT_ORDER } from '../config/marketWatchConfig.js'

/** @typedef {'up' | 'down' | 'flat'} MarketDirection */

/** @param {string} id */
function metaById(id) {
  return MARKET_INSTRUMENTS.find((m) => m.id === id)
}

export function createMarketRowSkeletons() {
  return MARKET_INSTRUMENT_ORDER.map((id) => {
    const m = metaById(id)
    return {
      id: m.id,
      label: m.label,
      symbol: m.symbol,
      suffix: m.suffix,
      price: null,
      changePct: null,
      direction: /** @type {MarketDirection} */ ('flat'),
    }
  })
}

function directionFromPct(pct) {
  if (pct == null || Number.isNaN(pct)) return /** @type {MarketDirection} */ ('flat')
  if (Math.abs(pct) < 0.005) return 'flat'
  return pct > 0 ? 'up' : 'down'
}

/**
 * Market data is loaded only via serverless proxy (avoids browser CORS to Yahoo/CoinGecko/Binance/Stooq).
 * Set `VITE_MARKETS_API_URL` at build time to the full URL of `GET /api/markets`.
 */
function marketsProxyUrl() {
  const u = import.meta.env.VITE_MARKETS_API_URL
  return typeof u === 'string' && u.trim() ? u.trim() : ''
}

/**
 * @returns {Promise<{
 *   rows: Array<{
 *     id: string,
 *     label: string,
 *     symbol: string,
 *     suffix: string,
 *     price: number | null,
 *     changePct: number | null,
 *     direction: MarketDirection,
 *   }>,
 *   partial: boolean,
 *   allFailed: boolean,
 *   errorMessage: string | null,
 * }>}
 */
export async function fetchMarkets() {
  const endpoint = marketsProxyUrl()
  const rows = createMarketRowSkeletons()

  if (!endpoint) {
    return {
      rows,
      partial: true,
      allFailed: true,
      errorMessage: 'Market data proxy is not configured. Set VITE_MARKETS_API_URL to your /api/markets URL.',
    }
  }

  let data
  try {
    const res = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } })
    if (!res.ok) {
      console.error('[Market watch] Proxy HTTP', res.status, endpoint)
      return {
        rows,
        partial: true,
        allFailed: true,
        errorMessage: 'Unable to load market quotes.',
      }
    }
    data = await res.json()
  } catch (e) {
    console.error('[Market watch] Proxy fetch failed', e)
    return {
      rows,
      partial: true,
      allFailed: true,
      errorMessage: 'Unable to load market quotes.',
    }
  }

  if (!data?.ok || !Array.isArray(data.quotes)) {
    return {
      rows,
      partial: true,
      allFailed: true,
      errorMessage: 'Invalid market proxy response.',
    }
  }

  /** @type {Record<string, { price: unknown, changePct: unknown }>} */
  const byId = Object.fromEntries(
    data.quotes.map((q) => [q.id, { price: q.price, changePct: q.changePct }])
  )

  for (const row of rows) {
    const q = byId[row.id]
    if (!q) continue
    const price = q.price
    const changePct = q.changePct
    if (price != null && Number.isFinite(Number(price))) {
      row.price = Number(price)
    }
    if (changePct != null && Number.isFinite(Number(changePct))) {
      row.changePct = Number(changePct)
      row.direction = directionFromPct(row.changePct)
    } else {
      row.changePct = null
      row.direction = 'flat'
    }
  }

  const partial = rows.some((r) => r.price == null)
  const allFailed = rows.every((r) => r.price == null)
  return {
    rows,
    partial,
    allFailed,
    errorMessage: allFailed ? 'Unable to load market quotes.' : null,
  }
}

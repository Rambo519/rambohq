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

function normalizeYahooSymbolKey(s) {
  return String(s ?? '').trim().toUpperCase()
}

const YAHOO_INSTRUMENTS = MARKET_INSTRUMENTS.filter((m) => m.yahoo)

function buildYahooSymbolToIdMap() {
  /** @type {Map<string, string>} */
  const map = new Map()
  for (const m of YAHOO_INSTRUMENTS) {
    if (m.yahoo) map.set(normalizeYahooSymbolKey(m.yahoo), m.id)
    for (const a of m.yahooAliases || []) {
      map.set(normalizeYahooSymbolKey(a), m.id)
    }
  }
  return map
}

const YAHOO_SYMBOL_TO_ID = buildYahooSymbolToIdMap()

/**
 * @param {{ price: number | null, changePct: number | null, direction: MarketDirection }} row
 * @param {number | null | undefined} price
 * @param {number | null | undefined} changePct
 */
function applyPriceChange(row, price, changePct) {
  if (price == null || Number.isNaN(Number(price))) return
  row.price = Number(price)
  if (changePct != null && !Number.isNaN(Number(changePct))) {
    row.changePct = Number(changePct)
    row.direction = directionFromPct(row.changePct)
  } else {
    row.changePct = null
    row.direction = 'flat'
  }
}

/**
 * Apply one Yahoo quote object to a row (same rules as batch merge).
 * @param {{ price: number | null, changePct: number | null, direction: MarketDirection }} row
 * @param {Record<string, unknown>} q
 */
function applyYahooQuoteToRow(row, q) {
  if (row.price != null) return
  const price = q.regularMarketPrice
  if (price == null || Number.isNaN(Number(price))) return
  let pct = q.regularMarketChangePercent
  const prev = q.regularMarketPreviousClose
  if ((pct == null || Number.isNaN(Number(pct))) && prev != null && Number(prev) > 0) {
    pct = ((Number(price) - Number(prev)) / Number(prev)) * 100
  }
  applyPriceChange(row, price, pct)
}

/** Single-symbol Yahoo v7 quote (fallback when batch omits or mismatches a symbol). */
async function fetchYahooSingleQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error('[Market watch] Yahoo single quote HTTP', res.status, url)
      return null
    }
    const data = await res.json()
    const qErr = data.quoteResponse?.error
    if (qErr) {
      console.error('[Market watch] Yahoo single quote error', symbol, qErr)
      return null
    }
    const result = data.quoteResponse?.result
    if (!Array.isArray(result) || result.length < 1) return null
    return result[0]
  } catch (e) {
    console.error('[Market watch] Yahoo single quote failed', symbol, url, e)
    return null
  }
}

async function fetchYahooQuotes() {
  const symbols = YAHOO_INSTRUMENTS.map((m) => m.yahoo).filter(Boolean).join(',')
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[Market watch] Yahoo quote HTTP', res.status)
    throw new Error(`Yahoo HTTP ${res.status}`)
  }
  const data = await res.json()
  const qErr = data.quoteResponse?.error
  if (qErr) {
    console.error('[Market watch] Yahoo quoteResponse.error', qErr)
    throw new Error(typeof qErr === 'string' ? qErr : 'Yahoo quote error')
  }
  return data.quoteResponse?.result ?? []
}

/**
 * Try comma- then semicolon-delimited rows; 5th field = close.
 * @param {string} text
 */
function parseStooqDailyLatestCloseDetailed(text) {
  const snippet = (text || '').slice(0, 500)
  const tryDelim = (delim) => {
    const lines = text.trim().split(/\r?\n/).filter(Boolean)
    const closes = []
    for (const line of lines) {
      const parts = line.split(delim)
      if (parts.length < 5) continue
      let raw = parts[4].trim().replace(/\s/g, '')
      let close = Number.parseFloat(raw)
      if (!Number.isFinite(close) && /^\d+,\d+$/.test(raw)) {
        close = Number.parseFloat(raw.replace(',', '.'))
      }
      if (!Number.isFinite(close)) continue
      closes.push(close)
    }
    return { closes, lineCount: lines.length, delim }
  }

  let { closes, lineCount, delim } = tryDelim(',')
  if (closes.length < 1) {
    const semi = tryDelim(';')
    if (semi.closes.length > 0) {
      closes = semi.closes
      lineCount = semi.lineCount
      delim = semi.delim
    }
  }

  const validNumericRows = closes.length
  if (validNumericRows < 1) {
    return {
      parsed: null,
      validNumericRows,
      lineCount,
      delimiterUsed: delim,
      textSnippet: snippet,
    }
  }
  const latest = closes[closes.length - 1]
  const previousClose = closes.length >= 2 ? closes[closes.length - 2] : null
  let changePct = null
  if (previousClose != null && previousClose > 0) {
    changePct = ((latest - previousClose) / previousClose) * 100
  }
  return {
    parsed: { latest, previousClose, changePct },
    validNumericRows,
    lineCount,
    delimiterUsed: delim,
    textSnippet: snippet,
  }
}

function parseStooqDailyLatestClose(text) {
  const d = parseStooqDailyLatestCloseDetailed(text)
  return d.parsed
}

/**
 * Gold-only Stooq fallback (optional; may fail under browser CORS).
 * @param {string} symbol e.g. xauusd
 */
async function fetchStooqNonIndex(symbol) {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d&l=5`
  let res
  try {
    res = await fetch(url)
  } catch (e) {
    console.error('[Market watch] Stooq fetch failed:', symbol, e)
    return null
  }
  if (!res.ok) {
    console.error('[Market watch] Stooq HTTP', res.status, symbol, url)
    return null
  }
  const text = await res.text()
  const parsed = parseStooqDailyLatestClose(text)
  if (!parsed) {
    console.error('[Market watch] Stooq parse failed (no valid close):', symbol, url)
  }
  return parsed
}

/**
 * @param {string[]} coingeckoIds
 */
async function fetchCoinGeckoSimple(coingeckoIds) {
  if (coingeckoIds.length === 0) return {}
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    coingeckoIds.join(',')
  )}&vs_currencies=usd&include_24hr_change=true`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[Market watch] CoinGecko HTTP', res.status)
    throw new Error(`CoinGecko HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * @param {string} pair e.g. BTCUSDT
 */
async function fetchBinance24h(pair) {
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(pair)}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[Market watch] Binance HTTP', res.status, pair)
    throw new Error(`Binance HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * Live quotes: Yahoo batch for all six, then CoinGecko / Binance gaps, then Stooq for gold only.
 *
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
  const rows = createMarketRowSkeletons()
  /** @type {Record<string, (typeof rows)[number]>} */
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]))

  try {
    const quotes = await fetchYahooQuotes()
    for (const q of quotes) {
      const id = YAHOO_SYMBOL_TO_ID.get(normalizeYahooSymbolKey(q.symbol))
      if (!id) continue
      const row = byId[id]
      applyYahooQuoteToRow(row, q)
    }
  } catch (e) {
    console.error('[Market watch] Yahoo batch failed:', e)
  }

  for (const m of MARKET_INSTRUMENTS) {
    const retries = m.yahooRetrySymbols
    if (!retries?.length || byId[m.id].price != null) continue
    for (const sym of retries) {
      const q = await fetchYahooSingleQuote(sym)
      if (!q) continue
      applyYahooQuoteToRow(byId[m.id], q)
      if (byId[m.id].price != null) break
    }
  }

  const needCoingecko = MARKET_INSTRUMENTS.filter((m) => m.coingeckoId && byId[m.id].price == null).map(
    (m) => m.coingeckoId
  )
  const uniqueCg = [...new Set(needCoingecko)]
  if (uniqueCg.length > 0) {
    try {
      const cg = await fetchCoinGeckoSimple(uniqueCg)
      for (const m of MARKET_INSTRUMENTS) {
        if (!m.coingeckoId || byId[m.id].price != null) continue
        const block = cg[m.coingeckoId]
        if (!block || block.usd == null) continue
        applyPriceChange(byId[m.id], block.usd, block.usd_24h_change)
      }
    } catch (e) {
      console.error('[Market watch] CoinGecko batch failed:', e)
    }
  }

  const silverRow = byId.silver
  if (silverRow && silverRow.price == null) {
    try {
      const cgSilver = await fetchCoinGeckoSimple(['silver'])
      const b = cgSilver.silver
      if (b?.usd != null) {
        applyPriceChange(silverRow, b.usd, b.usd_24h_change)
      }
    } catch (e) {
      console.error('[Market watch] Silver CoinGecko fallback id=silver failed:', e)
    }
  }

  for (const m of MARKET_INSTRUMENTS) {
    if (!m.binance || byId[m.id].price != null) continue
    try {
      const b = await fetchBinance24h(m.binance)
      applyPriceChange(byId[m.id], Number.parseFloat(b.lastPrice), Number.parseFloat(b.priceChangePercent))
    } catch (e) {
      console.error('[Market watch] Binance failed:', m.id, e)
    }
  }

  const stooqGoldOnly = MARKET_INSTRUMENTS.filter((m) => m.stooq && byId[m.id].price == null)
  await Promise.all(
    stooqGoldOnly.map(async (m) => {
      try {
        const snap = await fetchStooqNonIndex(m.stooq)
        if (!snap) return
        applyPriceChange(byId[m.id], snap.latest, snap.changePct)
      } catch (e) {
        console.error('[Market watch] Stooq failed:', m.id, e)
      }
    })
  )

  const partial = rows.some((r) => r.price == null)
  const allFailed = rows.every((r) => r.price == null)
  return {
    rows,
    partial,
    allFailed,
    errorMessage: allFailed ? 'Unable to load market quotes.' : null,
  }
}

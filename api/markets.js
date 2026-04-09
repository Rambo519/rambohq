/**
 * Serverless market proxy — runs on Vercel/Node only (no browser CORS limits).
 * GET /api/markets → normalized quotes for the six Market Watch instruments.
 */

const UA = 'Mozilla/5.0 (compatible; RamboHQ/1.0; +https://github.com)'

/** @type {readonly { id: string, name: string, symbol: string, yahoo: string, yahooEtf?: string, yahooIndex?: string, binance?: string, coingeckoId?: string, stooq?: string }[]} */
const INSTRUMENTS = [
  { id: 'djia', name: 'Dow Jones', symbol: 'DJIA', yahoo: '^DJI', yahooEtf: 'DIA', yahooIndex: '^DJI', stooq: 'dia.us' },
  { id: 'spx', name: 'S&P 500', symbol: 'SPX', yahoo: '^GSPC', yahooEtf: 'SPY', yahooIndex: '^GSPC', stooq: 'spy.us' },
  { id: 'ixic', name: 'Nasdaq', symbol: 'IXIC', yahoo: '^IXIC', yahooEtf: 'QQQ', yahooIndex: '^IXIC', stooq: 'qqq.us' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', yahoo: 'BTC-USD', binance: 'BTCUSDT', coingeckoId: 'bitcoin' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', yahoo: 'ETH-USD', binance: 'ETHUSDT', coingeckoId: 'ethereum' },
  { id: 'gold', name: 'Gold', symbol: 'XAU', yahoo: 'GC=F', coingeckoId: 'pax-gold', stooq: 'xauusd' },
]

function normSym(s) {
  return String(s ?? '').trim().toUpperCase()
}

function yahooMap() {
  /** @type {Map<string, string>} */
  const m = new Map()
  for (const inst of INSTRUMENTS) {
    m.set(normSym(inst.yahoo), inst.id)
  }
  return m
}

/**
 * @param {Record<string, unknown>} q
 * @returns {{ price: number, changePct: number | null } | null}
 */
function fromYahooQuote(q) {
  const price = q.regularMarketPrice
  if (price == null || Number.isNaN(Number(price))) return null
  let pct = q.regularMarketChangePercent
  const prev = q.regularMarketPreviousClose
  if ((pct == null || Number.isNaN(Number(pct))) && prev != null && Number(prev) > 0) {
    pct = ((Number(price) - Number(prev)) / Number(prev)) * 100
  }
  return {
    price: Number(price),
    changePct: pct != null && !Number.isNaN(Number(pct)) ? Number(pct) : null,
  }
}

async function yahooBatch(symbols) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)
  const data = await res.json()
  if (data.quoteResponse?.error) throw new Error(String(data.quoteResponse.error))
  return data.quoteResponse?.result ?? []
}

async function yahooSingle(symbol) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  if (data.quoteResponse?.error) return null
  const r = data.quoteResponse?.result
  return Array.isArray(r) && r[0] ? r[0] : null
}

/**
 * @param {string} symbol
 * @returns {Promise<{ price: number, changePct: number | null } | null>}
 */
async function yahooChartMeta(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    if (data.chart?.error) return null
    const result0 = data.chart?.result?.[0]
    const meta = result0?.meta
    if (!meta) return null
    let price = meta.regularMarketPrice
    if (price == null || Number.isNaN(Number(price))) {
      const closes = result0?.indicators?.quote?.[0]?.close
      if (Array.isArray(closes)) {
        for (let i = closes.length - 1; i >= 0; i--) {
          const c = closes[i]
          if (c != null && Number.isFinite(Number(c))) {
            price = Number(c)
            break
          }
        }
      }
    }
    if (price == null || Number.isNaN(Number(price))) return null
    const prev = meta.chartPreviousClose ?? meta.previousClose
    let changePct = null
    if (prev != null && Number(prev) > 0) {
      changePct = ((Number(price) - Number(prev)) / Number(prev)) * 100
    }
    return { price: Number(price), changePct }
  } catch {
    return null
  }
}

function parseStooqDailyLatestClose(text) {
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
    return closes
  }
  let closes = tryDelim(',')
  if (closes.length < 1) closes = tryDelim(';')
  if (closes.length < 1) return null
  const latest = closes[closes.length - 1]
  const previousClose = closes.length >= 2 ? closes[closes.length - 2] : null
  let changePct = null
  if (previousClose != null && previousClose > 0) {
    changePct = ((latest - previousClose) / previousClose) * 100
  }
  return { latest, changePct }
}

async function stooqDaily(symbol) {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d&l=5`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return null
  return parseStooqDailyLatestClose(await res.text())
}

async function coinGeckoBatch(ids) {
  if (ids.length === 0) return {}
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd&include_24hr_change=true`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`)
  return res.json()
}

async function binance24h(pair) {
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(pair)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`)
  return res.json()
}

async function buildQuotes() {
  /** @type {Record<string, { price: number | null, changePct: number | null }>} */
  const out = {}
  for (const inst of INSTRUMENTS) {
    out[inst.id] = { price: null, changePct: null }
  }

  const symToId = yahooMap()

  try {
    const quotes = await yahooBatch(INSTRUMENTS.map((i) => i.yahoo))
    for (const q of quotes) {
      const id = symToId.get(normSym(q.symbol))
      if (!id) continue
      const snap = fromYahooQuote(q)
      if (snap) {
        out[id] = { price: snap.price, changePct: snap.changePct }
      }
    }
  } catch {
    /* fall through to per-source fallbacks */
  }

  for (const inst of INSTRUMENTS) {
    if (out[inst.id].price != null) continue
    if (inst.yahooEtf) {
      const q = await yahooSingle(inst.yahooEtf)
      if (q) {
        const snap = fromYahooQuote(q)
        if (snap) out[inst.id] = { price: snap.price, changePct: snap.changePct }
      }
    }
  }

  for (const inst of INSTRUMENTS) {
    if (out[inst.id].price != null || !inst.yahooIndex) continue
    const snap = await yahooChartMeta(inst.yahooIndex)
    if (snap) out[inst.id] = { price: snap.price, changePct: snap.changePct }
  }

  const needCg = INSTRUMENTS.filter((i) => i.coingeckoId && out[i.id].price == null).map((i) => i.coingeckoId)
  const uniqCg = [...new Set(needCg)]
  if (uniqCg.length > 0) {
    try {
      const cg = await coinGeckoBatch(uniqCg)
      for (const inst of INSTRUMENTS) {
        if (!inst.coingeckoId || out[inst.id].price != null) continue
        const b = cg[inst.coingeckoId]
        if (b?.usd != null) {
          out[inst.id] = {
            price: Number(b.usd),
            changePct: b.usd_24h_change != null ? Number(b.usd_24h_change) : null,
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  for (const inst of INSTRUMENTS) {
    if (!inst.binance || out[inst.id].price != null) continue
    try {
      const b = await binance24h(inst.binance)
      out[inst.id] = {
        price: Number.parseFloat(b.lastPrice),
        changePct: Number.parseFloat(b.priceChangePercent),
      }
    } catch {
      /* ignore */
    }
  }

  for (const inst of INSTRUMENTS) {
    if (!inst.stooq || out[inst.id].price != null) continue
    const snap = await stooqDaily(inst.stooq)
    if (snap) {
      out[inst.id] = { price: snap.latest, changePct: snap.changePct }
    }
  }

  return INSTRUMENTS.map((inst) => {
    const v = out[inst.id]
    return {
      id: inst.id,
      symbol: inst.symbol,
      name: inst.name,
      price: v.price,
      changePct: v.changePct,
    }
  })
}

/** @param {import('http').IncomingMessage} req @param {import('http').ServerResponse} res */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const quotes = await buildQuotes()
    const partial = quotes.some((q) => q.price == null)
    return res.status(200).json({ ok: true, partial, quotes })
  } catch (e) {
    console.error('[api/markets]', e)
    return res.status(500).json({ ok: false, error: 'Market proxy failed', quotes: [] })
  }
}

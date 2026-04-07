/**
 * Market Watch — instrument registry and provider symbol mapping.
 * Edit `yahoo`, `stooq`, `binance`, and `coingeckoId` when switching providers.
 */
export const MARKET_INSTRUMENTS = [
  {
    id: 'sol',
    label: 'Solana',
    symbol: 'SOL',
    suffix: 'USD',
    yahoo: 'SOL-USD',
    binance: 'SOLUSDT',
    coingeckoId: 'solana',
  },
  {
    id: 'silver',
    label: 'Silver',
    symbol: 'XAG',
    suffix: 'USD/oz',
    /** Comex future; Yahoo may omit from batch or return under a different symbol key. */
    yahoo: 'SI=F',
    yahooAliases: ['XAGUSD=X', 'XAG=X', 'SIL=F'],
    /** If batch + Yahoo retries miss, try CoinGecko (tokenized / synthetic silver USD). */
    coingeckoId: 'kinesis-silver',
    /** One-off Yahoo quotes when the batch does not return a usable SI=F / XAG row. */
    yahooRetrySymbols: ['XAGUSD=X', 'XAG=X', 'SI=F'],
  },
  {
    id: 'ada',
    label: 'Cardano',
    symbol: 'ADA',
    suffix: 'USD',
    yahoo: 'ADA-USD',
    binance: 'ADAUSDT',
    coingeckoId: 'cardano',
  },
  {
    id: 'btc',
    label: 'Bitcoin',
    symbol: 'BTC',
    suffix: 'USD',
    yahoo: 'BTC-USD',
    binance: 'BTCUSDT',
    coingeckoId: 'bitcoin',
  },
  {
    id: 'eth',
    label: 'Ethereum',
    symbol: 'ETH',
    suffix: 'USD',
    yahoo: 'ETH-USD',
    binance: 'ETHUSDT',
    coingeckoId: 'ethereum',
  },
  {
    id: 'gold',
    label: 'Gold',
    symbol: 'XAU',
    suffix: 'USD/oz',
    yahoo: 'GC=F',
    stooq: 'xauusd',
    coingeckoId: 'pax-gold',
  },
]

/** Stable display order (left column first three, right column last three). */
export const MARKET_INSTRUMENT_ORDER = MARKET_INSTRUMENTS.map((m) => m.id)

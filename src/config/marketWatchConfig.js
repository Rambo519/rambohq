/**
 * Market Watch — display order and labels only. Live prices come from the serverless proxy (`VITE_MARKETS_API_URL`).
 */
export const MARKET_INSTRUMENTS = [
  { id: 'djia', label: 'Dow Jones', symbol: 'DJIA', suffix: '' },
  { id: 'spx', label: 'S&P 500', symbol: 'SPX', suffix: '' },
  { id: 'ixic', label: 'Nasdaq', symbol: 'IXIC', suffix: '' },
  { id: 'btc', label: 'Bitcoin', symbol: 'BTC', suffix: 'USD' },
  { id: 'eth', label: 'Ethereum', symbol: 'ETH', suffix: 'USD' },
  { id: 'gold', label: 'Gold', symbol: 'XAU', suffix: 'USD/oz' },
]

/** First three = left column, last three = right column. */
export const MARKET_INSTRUMENT_ORDER = MARKET_INSTRUMENTS.map((m) => m.id)

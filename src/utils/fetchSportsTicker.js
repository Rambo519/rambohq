/**
 * Sports ticker data: Cleveland teams + next UFC card (ESPN public JSON).
 *
 * @typedef {'final' | 'live' | 'scheduled'} GameState
 * @typedef {Object} TickerRow
 * @property {string} id
 * @property {'team' | 'ufc'} rowKind
 * @property {string} teamName
 * @property {string} league
 * @property {string} matchupLine
 * @property {string} venueLine
 * @property {GameState} state
 * @property {string | null} scoreLine
 * @property {string | null} dateDisplay  UFC: event date; team rows optional null
 * @property {string | null} [nextMatchupLine]  team: game after featured (same window)
 * @property {string | null} [nextTimeLine]     team: short date/time for next game
 */

import {
  SPORTS_TICKER_ENTRIES,
  SCOREBOARD_DAYS_FUTURE,
  SCOREBOARD_DAYS_PAST,
} from '../config/sportsTickerConfig'

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports'

function formatYyyymmdd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function buildDatesRangeParam() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - SCOREBOARD_DAYS_PAST)
  const end = new Date(now)
  end.setDate(end.getDate() + SCOREBOARD_DAYS_FUTURE)
  return `${formatYyyymmdd(start)}-${formatYyyymmdd(end)}`
}

async function fetchScoreboardJson(sportPath) {
  const baseUrl = `${ESPN_SCOREBOARD}/${sportPath}/scoreboard`
  const range = buildDatesRangeParam()
  const urlWithRange = `${baseUrl}?${new URLSearchParams({ dates: range })}`

  console.log(`[Sports ticker] ESPN ${sportPath.toUpperCase()} request URL:`, urlWithRange)

  let res = await fetch(urlWithRange)

  if (!res.ok) {
    const errText = await res.text()
    console.error(`[Sports ticker] ESPN ${sportPath} response:`, res.status, errText)

    if (res.status === 400) {
      console.log(`[Sports ticker] ESPN ${sportPath.toUpperCase()} fallback URL (no dates):`, baseUrl)
      res = await fetch(baseUrl)
      if (!res.ok) {
        const errText2 = await res.text()
        console.error(`[Sports ticker] ESPN ${sportPath} fallback response:`, res.status, errText2)
        throw new Error(`ESPN ${sportPath} failed (${res.status})`)
      }
      return res.json()
    }

    throw new Error(`ESPN ${sportPath} failed (${res.status})`)
  }

  return res.json()
}

/**
 * @param {unknown} event
 * @param {string} cleAbbr
 */
function parseCleEvent(event, cleAbbr) {
  if (!event || typeof event !== 'object') return null
  const comp = event.competitions?.[0]
  if (!comp) return null
  const comps = comp.competitors
  if (!Array.isArray(comps) || comps.length < 2) return null

  const cle = comps.find((c) => c?.team?.abbreviation === cleAbbr)
  const opp = comps.find((c) => c?.team?.abbreviation && c.team.abbreviation !== cleAbbr)
  if (!cle || !opp) return null

  const state = comp.status?.type?.state
  /** @type {GameState} */
  let gameState = 'scheduled'
  if (state === 'in') gameState = 'live'
  else if (state === 'post') gameState = 'final'

  const cleName = cle.team?.shortDisplayName || cle.team?.displayName || cleAbbr
  const oppName = opp.team?.shortDisplayName || opp.team?.displayName || 'Opponent'
  const matchupLine = `${cleName} vs ${oppName}`

  const venue = comp.venue
  const venueLine =
    (typeof venue?.fullName === 'string' && venue.fullName) ||
    (typeof venue?.address?.city === 'string' && venue.address.city) ||
    '—'

  let scoreLine = null
  if (gameState === 'live' || gameState === 'final') {
    const a = cle.score != null ? String(cle.score) : '0'
    const b = opp.score != null ? String(opp.score) : '0'
    scoreLine = `${a} – ${b}`
  }

  const rawDate = typeof event.date === 'string' ? event.date : ''
  const eventId =
    event.id != null && String(event.id).length > 0 ? String(event.id) : `${rawDate}|${matchupLine}`

  return { rawDate, gameState, matchupLine, venueLine, scoreLine, eventId }
}

function listTeamGamesParsed(events, cleAbbr) {
  if (!Array.isArray(events)) return []
  return events.map((e) => parseCleEvent(e, cleAbbr)).filter((p) => p != null && p.rawDate)
}

function pickBestTeamGame(events, cleAbbr) {
  const parsed = listTeamGamesParsed(events, cleAbbr)
  if (!parsed.length) return null

  const live = parsed.filter((p) => p.gameState === 'live')
  if (live.length) {
    return live.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))[0]
  }

  const finals = parsed.filter((p) => p.gameState === 'final')
  if (finals.length) {
    return finals.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate))[0]
  }

  const upcoming = parsed.filter((p) => p.gameState === 'scheduled')
  if (upcoming.length) {
    return upcoming.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))[0]
  }

  return null
}

/**
 * Chronological next game in the scoreboard window after the featured event.
 */
function pickNextTeamGame(events, cleAbbr, featured) {
  if (!featured) return null
  const sorted = listTeamGamesParsed(events, cleAbbr).sort(
    (a, b) => new Date(a.rawDate) - new Date(b.rawDate)
  )
  const idx = sorted.findIndex(
    (p) => p.eventId === featured.eventId || (p.rawDate === featured.rawDate && p.matchupLine === featured.matchupLine)
  )
  if (idx === -1 || idx >= sorted.length - 1) return null
  return sorted[idx + 1]
}

function formatNextGameDisplay(isoStr) {
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * @param {unknown} event
 */
function parseUfcCard(event) {
  if (!event || typeof event !== 'object') return null
  const dateStr = typeof event.date === 'string' ? event.date : ''
  if (!dateStr) return null

  const comps = event.competitions
  if (!Array.isArray(comps) || comps.length === 0) {
    const label = typeof event.shortName === 'string' ? event.shortName : event.name
    if (typeof label !== 'string' || !label.trim()) return null
    const eventDate = new Date(dateStr)
    const dateDisplay = formatEventDate(eventDate)
    const st = event.status?.type?.state
    let gameState = 'scheduled'
    if (st === 'in') gameState = 'live'
    else if (st === 'post') gameState = 'final'
    return {
      rawDate: dateStr,
      gameState,
      matchupLine: label.trim(),
      venueLine: '—',
      dateDisplay,
      scoreLine: null,
    }
  }

  let mainComp = comps[comps.length - 1]
  for (let i = comps.length - 1; i >= 0; i--) {
    const typeText = `${comps[i]?.type?.text || ''} ${comps[i]?.type?.detail || ''}`
    if (/main/i.test(typeText)) {
      mainComp = comps[i]
      break
    }
  }

  const pair = mainComp?.competitors
  let matchupLine = ''
  if (Array.isArray(pair) && pair.length >= 2) {
    const a = pair[0]?.athlete
    const b = pair[1]?.athlete
    const n1 = a?.displayName || a?.shortName || a?.fullName
    const n2 = b?.displayName || b?.shortName || b?.fullName
    if (n1 && n2) matchupLine = `${n1} vs ${n2}`
  }

  if (!matchupLine) {
    const label = typeof event.shortName === 'string' ? event.shortName : event.name
    if (typeof label === 'string' && label.trim()) matchupLine = label.trim()
  }
  if (!matchupLine) return null

  const v = mainComp?.venue || event.venue
  const venueLine =
    (typeof v?.fullName === 'string' && v.fullName) ||
    (typeof v?.address?.city === 'string' && v.address.city) ||
    '—'

  const fightState = mainComp?.status?.type?.state
  const eventState = event.status?.type?.state
  const state = fightState || eventState || 'pre'
  /** @type {GameState} */
  let gameState = 'scheduled'
  if (state === 'in') gameState = 'live'
  else if (state === 'post') gameState = 'final'

  const eventDate = new Date(dateStr)
  const dateDisplay = formatEventDate(eventDate)

  return {
    rawDate: dateStr,
    gameState,
    matchupLine,
    venueLine,
    dateDisplay,
    scoreLine: null,
  }
}

function formatEventDate(eventDate) {
  if (Number.isNaN(eventDate.getTime())) return '—'
  const nowY = new Date().getFullYear()
  return eventDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(eventDate.getFullYear() !== nowY ? { year: 'numeric' } : {}),
  })
}

function pickBestUfcCard(events) {
  if (!Array.isArray(events)) return null
  const parsed = events.map(parseUfcCard).filter((p) => p != null && p.rawDate)
  if (!parsed.length) return null

  const withD = parsed.map((p) => ({ ...p, _d: new Date(p.rawDate).getTime() }))

  const live = withD.filter((p) => p.gameState === 'live')
  if (live.length) return live.sort((a, b) => a._d - b._d)[0]

  const upcoming = withD.filter((p) => p.gameState === 'scheduled')
  if (upcoming.length) return upcoming.sort((a, b) => a._d - b._d)[0]

  const finals = withD.filter((p) => p.gameState === 'final')
  if (finals.length) return finals.sort((a, b) => b._d - a._d)[0]

  return null
}

/**
 * @returns {Promise<TickerRow[]>}
 */
export async function fetchSportsTickerData() {
  const paths = [...new Set(SPORTS_TICKER_ENTRIES.map((t) => t.espnSportPath))]
  const cache = new Map()

  await Promise.all(
    paths.map(async (path) => {
      try {
        const json = await fetchScoreboardJson(path)
        cache.set(path, Array.isArray(json?.events) ? json.events : [])
      } catch (err) {
        console.error(`[Sports ticker] Failed to load scoreboard for ${path}:`, err)
        cache.set(path, null)
      }
    })
  )

  return SPORTS_TICKER_ENTRIES.map((entry) => {
    const events = cache.get(entry.espnSportPath)

    if (events === null) {
      return {
        id: entry.id,
        rowKind: entry.kind,
        teamName: entry.teamName,
        league: entry.league,
        matchupLine: '—',
        venueLine: '—',
        state: 'scheduled',
        scoreLine: null,
        dateDisplay: null,
        ...(entry.kind === 'team' ? { nextMatchupLine: null, nextTimeLine: null } : {}),
      }
    }

    if (entry.kind === 'ufc') {
      const best = pickBestUfcCard(events)
      if (!best) {
        return {
          id: entry.id,
          rowKind: 'ufc',
          teamName: entry.teamName,
          league: entry.league,
          matchupLine: '—',
          venueLine: '—',
          state: 'scheduled',
          scoreLine: null,
          dateDisplay: null,
        }
      }
      return {
        id: entry.id,
        rowKind: 'ufc',
        teamName: entry.teamName,
        league: entry.league,
        matchupLine: best.matchupLine,
        venueLine: best.venueLine,
        state: best.gameState,
        scoreLine: null,
        dateDisplay: best.dateDisplay,
      }
    }

    const best = pickBestTeamGame(events, entry.espnAbbrev)
    if (!best) {
      return {
        id: entry.id,
        rowKind: 'team',
        teamName: entry.teamName,
        league: entry.league,
        matchupLine: '—',
        venueLine: '—',
        state: 'scheduled',
        scoreLine: null,
        dateDisplay: null,
        nextMatchupLine: null,
        nextTimeLine: null,
      }
    }

    const next = pickNextTeamGame(events, entry.espnAbbrev, best)

    return {
      id: entry.id,
      rowKind: 'team',
      teamName: entry.teamName,
      league: entry.league,
      matchupLine: best.matchupLine,
      venueLine: best.venueLine,
      state: best.gameState,
      scoreLine: best.scoreLine,
      dateDisplay: null,
      nextMatchupLine: next?.matchupLine ?? null,
      nextTimeLine: next?.rawDate ? formatNextGameDisplay(next.rawDate) : null,
    }
  })
}

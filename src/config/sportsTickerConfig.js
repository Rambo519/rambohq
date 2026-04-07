/**
 * Rows for the Sports ticker card (Cleveland teams + UFC). Edit labels/paths here.
 */
export const SCOREBOARD_DAYS_PAST = 4
export const SCOREBOARD_DAYS_FUTURE = 21

/** @typedef {{ id: string, teamName: string, league: string, kind: 'team', espnAbbrev: string, espnSportPath: string } | { id: string, teamName: string, league: string, kind: 'ufc', espnSportPath: string }} TickerEntry */

/** @type {TickerEntry[]} */
export const SPORTS_TICKER_ENTRIES = [
  {
    id: 'guardians',
    teamName: 'Guardians',
    league: 'MLB',
    kind: 'team',
    espnAbbrev: 'CLE',
    espnSportPath: 'baseball/mlb',
  },
  {
    id: 'cavaliers',
    teamName: 'Cavaliers',
    league: 'NBA',
    kind: 'team',
    espnAbbrev: 'CLE',
    espnSportPath: 'basketball/nba',
  },
  {
    id: 'browns',
    teamName: 'Browns',
    league: 'NFL',
    kind: 'team',
    espnAbbrev: 'CLE',
    espnSportPath: 'football/nfl',
  },
  {
    id: 'ufc',
    teamName: 'MMA',
    league: 'UFC',
    kind: 'ufc',
    espnSportPath: 'mma/ufc',
  },
]

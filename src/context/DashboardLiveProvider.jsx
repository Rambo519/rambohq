import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ASTRONOMY_REFRESH_MS,
  MARKET_REFRESH_MS,
  SPORTS_REFRESH_MS,
  WEATHER_REFRESH_MS,
} from '../config/refreshIntervals'
import { DashboardLiveContext } from './dashboardLiveContext'
import { createMarketRowSkeletons, fetchMarkets } from '../utils/fetchMarkets'
import { fetchOpenMeteoObservatorySnapshot } from '../utils/fetchOpenMeteoObservatory'
import { assembleObservatorySkyRecord } from '../utils/fetchObservatorySky'
import { fetchSolarArcData } from '../utils/fetchSolarArc'
import { fetchSportsTickerData } from '../utils/fetchSportsTicker'
import { computeMoonStateFromSunCalc } from '../utils/moonSunCalc'
import { fetchOpenMeteoForecast } from '../utils/openMeteoForecast'
import { resolveAppLocation } from '../utils/resolveAppLocation'
import { reverseGeocodePlaceLabel } from '../utils/reverseGeocode'

const EMPTY_WX = {
  cloudCoverPct: null,
  visibilityLabel: null,
  relativeHumidityPct: null,
}

/** @param {PromiseRejectedResult} r */
function rejectionMessage(r) {
  return r.reason instanceof Error ? r.reason.message : 'Request failed'
}

function usePageVisible() {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden
  )

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return visible
}

export function DashboardLiveProvider({ children }) {
  const pageVisible = usePageVisible()

  const [forecast, setForecast] = useState({
    status: 'loading',
    days: [],
    snapshot: null,
    errorMessage: '',
    coordSource: null,
    geocodedPlace: null,
  })

  const [solar, setSolar] = useState({
    status: 'loading',
    data: null,
    errorMessage: '',
  })

  const [observatory, setObservatory] = useState({
    status: 'loading',
    data: null,
    errorMessage: '',
  })

  const [market, setMarket] = useState({
    status: 'loading',
    rows: createMarketRowSkeletons(),
    errorMessage: '',
  })

  const [sports, setSports] = useState({
    status: 'loading',
    rows: [],
    errorMessage: '',
  })

  const generationRef = useRef(0)
  const moonRef = useRef(/** @type {{ at: number, moon: ReturnType<typeof computeMoonStateFromSunCalc> | null }} */ ({
    at: 0,
    moon: null,
  }))
  const coordsRef = useRef(
    /** @type {{ latitude: number, longitude: number, source: 'browser' | 'fallback' } | null} */ (null)
  )
  const locationMetaRef = useRef({
    geocodedPlace: /** @type {string | null} */ (null),
    source: /** @type {'browser' | 'fallback'} */ ('fallback'),
  })

  const tickRef = useRef({
    weatherSilent: () => {},
    astronomy: () => {},
    marketSilent: () => {},
    sportsSilent: () => {},
  })

  async function runWeatherPath(silent) {
    const gen = ++generationRef.current

    if (!silent) {
      setForecast({
        status: 'loading',
        days: [],
        snapshot: null,
        errorMessage: '',
        coordSource: null,
        geocodedPlace: null,
      })
      setSolar({ status: 'loading', data: null, errorMessage: '' })
      setObservatory({ status: 'loading', data: null, errorMessage: '' })
    }

    const { latitude, longitude, source } = await resolveAppLocation()
    if (gen !== generationRef.current) return

    coordsRef.current = { latitude, longitude, source }

    const [fcRes, solRes, wxRes, placeRes] = await Promise.allSettled([
      fetchOpenMeteoForecast(latitude, longitude),
      fetchSolarArcData(latitude, longitude),
      fetchOpenMeteoObservatorySnapshot(latitude, longitude),
      reverseGeocodePlaceLabel(latitude, longitude),
    ])
    if (gen !== generationRef.current) return

    const geocodedPlace = placeRes.status === 'fulfilled' ? placeRes.value : null
    locationMetaRef.current = { geocodedPlace, source }

    if (fcRes.status === 'fulfilled') {
      const { days, snapshot } = fcRes.value
      setForecast({
        status: 'ready',
        days,
        snapshot,
        errorMessage: '',
        coordSource: source,
        geocodedPlace,
      })
    } else {
      setForecast((prev) => {
        if (silent && prev.status === 'ready') return prev
        return {
          status: 'error',
          days: [],
          snapshot: null,
          errorMessage: rejectionMessage(fcRes) || 'Forecast unavailable',
          coordSource: source,
          geocodedPlace,
        }
      })
    }

    if (solRes.status === 'fulfilled') {
      setSolar({ status: 'ready', data: solRes.value, errorMessage: '' })
    } else {
      setSolar((prev) => {
        if (silent && prev.status === 'ready') return prev
        return {
          status: 'error',
          data: null,
          errorMessage: rejectionMessage(solRes) || 'Solar data unavailable',
        }
      })
    }

    let moon = moonRef.current.moon
    if (!moon) {
      moon = computeMoonStateFromSunCalc(latitude, longitude, new Date())
      moonRef.current = { at: Date.now(), moon }
    }

    setObservatory((prev) => {
      const wx =
        wxRes.status === 'fulfilled'
          ? wxRes.value
          : silent && prev.data
            ? {
                cloudCoverPct: prev.data.cloudCoverPct,
                visibilityLabel: prev.data.visibilityLabel,
                relativeHumidityPct: prev.data.relativeHumidityPct,
              }
            : EMPTY_WX

      const data = assembleObservatorySkyRecord(wx, moon, geocodedPlace, source)
      return {
        status: 'ready',
        data,
        errorMessage: '',
      }
    })
  }

  function runAstronomyRefresh() {
    const c = coordsRef.current
    if (!c) return

    const moon = computeMoonStateFromSunCalc(c.latitude, c.longitude, new Date())
    moonRef.current = { at: Date.now(), moon }

    const { geocodedPlace, source } = locationMetaRef.current

    setObservatory((prev) => {
      if (!prev.data) return prev
      const wx = {
        cloudCoverPct: prev.data.cloudCoverPct,
        visibilityLabel: prev.data.visibilityLabel,
        relativeHumidityPct: prev.data.relativeHumidityPct,
      }
      return {
        ...prev,
        data: assembleObservatorySkyRecord(wx, moon, geocodedPlace, source),
      }
    })
  }

  async function runMarkets(silent) {
    if (!silent) {
      setMarket((m) => ({
        ...m,
        status: 'loading',
        rows: createMarketRowSkeletons(),
        errorMessage: '',
      }))
    }
    try {
      const out = await fetchMarkets()
      setMarket((prev) => {
        if (out.allFailed) {
          if (silent && prev.status === 'ready') return prev
          return {
            status: 'error',
            rows: createMarketRowSkeletons(),
            errorMessage: out.errorMessage || 'Quotes unavailable',
          }
        }
        if (out.partial) {
          console.error('[Market watch] Partial quotes: some instruments did not load')
        }
        return { status: 'ready', rows: out.rows, errorMessage: '' }
      })
    } catch (e) {
      console.error('[Market watch] Unexpected failure:', e)
      setMarket((prev) => {
        if (silent && prev.status === 'ready') return prev
        return {
          status: 'error',
          rows: createMarketRowSkeletons(),
          errorMessage: e instanceof Error ? e.message : 'Quotes unavailable',
        }
      })
    }
  }

  async function runSports(silent) {
    if (!silent) {
      setSports({ status: 'loading', rows: [], errorMessage: '' })
    }
    try {
      const data = await fetchSportsTickerData()
      setSports({ status: 'ready', rows: data, errorMessage: '' })
    } catch (e) {
      setSports((prev) => {
        if (silent && prev.status === 'ready') return prev
        return {
          status: 'error',
          rows: [],
          errorMessage: e instanceof Error ? e.message : 'Ticker unavailable',
        }
      })
    }
  }

  useLayoutEffect(() => {
    tickRef.current.weatherSilent = () => {
      void runWeatherPath(true)
    }
    tickRef.current.astronomy = () => {
      runAstronomyRefresh()
    }
    tickRef.current.marketSilent = () => {
      void runMarkets(true)
    }
    tickRef.current.sportsSilent = () => {
      void runSports(true)
    }
  })

  useEffect(() => {
    void runWeatherPath(false)
    void runMarkets(false)
    void runSports(false)
  }, [])

  useEffect(() => {
    if (!pageVisible) return
    const id = window.setInterval(() => tickRef.current.weatherSilent(), WEATHER_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [pageVisible])

  useEffect(() => {
    if (!pageVisible) return
    const id = window.setInterval(() => tickRef.current.astronomy(), ASTRONOMY_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [pageVisible])

  useEffect(() => {
    if (!pageVisible) return
    const id = window.setInterval(() => tickRef.current.marketSilent(), MARKET_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [pageVisible])

  useEffect(() => {
    if (!pageVisible) return
    const id = window.setInterval(() => tickRef.current.sportsSilent(), SPORTS_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [pageVisible])

  const value = useMemo(
    () => ({
      forecast,
      solar,
      observatory,
      market,
      sports,
    }),
    [forecast, solar, observatory, market, sports]
  )

  return <DashboardLiveContext.Provider value={value}>{children}</DashboardLiveContext.Provider>
}

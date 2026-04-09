import { DashboardHeader } from './components/DashboardHeader'
import { ForecastRow } from './components/ForecastRow'
import { SystemStatusPanel } from './components/SystemStatusPanel'
import { SunTimesPanel } from './components/SunTimesPanel'
import { MarketWatchPanel } from './components/MarketWatchPanel'
import { SportsTickerPanel } from './components/SportsTickerPanel'
import { SkyConditionsPanel } from './components/SkyConditionsPanel'

function App() {
  return (
    <div className="hq-app">
      <div className="hq-scanlines" aria-hidden />
      <DashboardHeader />
      <main className="hq-main">
        <div className="hq-grid">
          <ForecastRow />
          <SkyConditionsPanel />
          <SunTimesPanel />
          <MarketWatchPanel />
          <SystemStatusPanel />
          <SportsTickerPanel />
        </div>
      </main>
    </div>
  )
}

export default App

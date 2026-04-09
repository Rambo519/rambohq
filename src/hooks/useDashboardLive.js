import { useContext } from 'react'
import { DashboardLiveContext } from '../context/dashboardLiveContext'

export function useDashboardLive() {
  const ctx = useContext(DashboardLiveContext)
  if (!ctx) {
    throw new Error('useDashboardLive must be used within DashboardLiveProvider')
  }
  return ctx
}

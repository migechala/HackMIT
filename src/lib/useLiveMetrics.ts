import { useEffect, useRef, useState } from 'react'
import type { Datacenter } from './mockData'

export interface LiveMetrics {
  ancActive: boolean
  attenuationDb: number
  residualDbA: number
  powerW: number
  energyTodayWh: number
  phaseAdjustmentDeg: number
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function useLiveMetrics(dc: Datacenter) {
  const [ancActive, setAncActive] = useState(true)
  const baseAttenuation = 12.4
  const [tick, setTick] = useState(0)
  const energyRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1800)
    return () => clearInterval(id)
  }, [])

  const jitter = Math.sin(tick * 0.7) * 0.3 + (Math.random() - 0.5) * 0.4
  const attenuationDb = ancActive ? round1(baseAttenuation + jitter) : 0
  const residualDbA = round1(dc.baselineDbA - attenuationDb)
  const powerW = ancActive ? round1(5.2 + Math.sin(tick * 0.5) * 0.3) : round1(0.4 + Math.random() * 0.1)

  energyRef.current += (powerW / 1000) * (1800 / 3600 / 1000) // negligible increment per tick, kept smooth
  const energyTodayWh = round1(powerW * (new Date().getHours() + new Date().getMinutes() / 60))

  const metrics: LiveMetrics = {
    ancActive,
    attenuationDb,
    residualDbA,
    powerW,
    energyTodayWh,
    phaseAdjustmentDeg: 180,
  }

  return { metrics, setAncActive }
}

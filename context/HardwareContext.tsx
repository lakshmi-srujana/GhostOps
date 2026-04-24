'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface HardwareState {
  voltage: number
  amperage: number
  isAnomaly: boolean
}

interface HardwareContextType extends HardwareState {
  toggleAnomaly: () => void
  injectAnomaly: () => void
  resetAnomaly: () => void
}

const HardwareContext = createContext<HardwareContextType | undefined>(undefined)

const STORAGE_KEY = 'ghostops.hardware.anomaly'
const NOMINAL_VOLTAGE = 3.3
const NOMINAL_AMPERAGE = 0.399
const SPIKE_VOLTAGE = 5.12
const SPIKE_AMPERAGE = 0.821

export const HardwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAnomaly, setIsAnomaly] = useState(false)
  const [voltage, setVoltage] = useState(NOMINAL_VOLTAGE)
  const [amperage, setAmperage] = useState(NOMINAL_AMPERAGE)
  const lastLoggedAnomaly = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedState = window.localStorage.getItem(STORAGE_KEY) === 'true'
    setIsAnomaly(storedState)
  }, [])

  useEffect(() => {
    if (isAnomaly && !lastLoggedAnomaly.current) {
      const logSpike = async () => {
        try {
          await supabase.from('mission_logs').insert([{
            agent_name: 'SYSTEM',
            output_data: `[CRITICAL]: Unidentified Power Spike detected in Silicon Sector 7-G. \nTelemetry: ${voltage.toFixed(3)}V | ${amperage.toFixed(3)}A`,
            created_at: new Date().toISOString()
          }])
          lastLoggedAnomaly.current = true
        } catch (err) {
          console.error('Failed to log spike:', err)
        }
      }
      logSpike()
    } else if (!isAnomaly) {
      lastLoggedAnomaly.current = false
    }
  }, [isAnomaly, voltage, amperage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(isAnomaly))
    }
  }, [isAnomaly])

  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() / 1000

      if (isAnomaly) {
        const vJitter = (Math.random() - 0.5) * 0.08
        const aJitter = (Math.random() - 0.5) * 0.08

        setVoltage(SPIKE_VOLTAGE + vJitter)
        setAmperage(Math.max(0.779, SPIKE_AMPERAGE + aJitter))
        return
      }

      const vDrift = Math.sin(time) * 0.002
      const aDrift = Math.sin(time * 1.2) * 0.004

      setVoltage(NOMINAL_VOLTAGE + vDrift)
      setAmperage(NOMINAL_AMPERAGE + aDrift)
    }, 500)

    return () => clearInterval(interval)
  }, [isAnomaly])

  const injectAnomaly = useCallback(() => {
    setIsAnomaly(true)
    setVoltage(SPIKE_VOLTAGE)
    setAmperage(SPIKE_AMPERAGE)
    console.log('[SYSTEM]: Unidentified Power Spike detected in Silicon Sector 7-G.')
  }, [])

  const resetAnomaly = useCallback(() => {
    setIsAnomaly(false)
    setVoltage(NOMINAL_VOLTAGE)
    setAmperage(NOMINAL_AMPERAGE)
  }, [])

  const toggleAnomaly = useCallback(() => {
    setIsAnomaly((current) => {
      const next = !current
      setVoltage(next ? SPIKE_VOLTAGE : NOMINAL_VOLTAGE)
      setAmperage(next ? SPIKE_AMPERAGE : NOMINAL_AMPERAGE)
      return next
    })
  }, [])

  return (
    <HardwareContext.Provider value={{ voltage, amperage, isAnomaly, toggleAnomaly, injectAnomaly, resetAnomaly }}>
      {children}
    </HardwareContext.Provider>
  )
}

export const useHardware = () => {
  const context = useContext(HardwareContext)
  if (context === undefined) {
    throw new Error('useHardware must be used within a HardwareProvider')
  }
  return context
}

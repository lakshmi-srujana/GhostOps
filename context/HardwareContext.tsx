'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface HardwareState {
  voltage: number
  amperage: number
  isAnomaly: boolean
}

interface HardwareContextType extends HardwareState {
  injectAnomaly: () => void
  resetAnomaly: () => void
}

const HardwareContext = createContext<HardwareContextType | undefined>(undefined)

const AMPS_THRESHOLD = 0.405;

export const HardwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voltage, setVoltage] = useState(3.3)
  const [amperage, setAmperage] = useState(0.399)
  const [isAnomaly, setIsAnomaly] = useState(false)
  const lastLoggedAnomaly = useRef(false)

  // Unbreakable Sync: isAnomaly is a direct result of amperage
  useEffect(() => {
    setIsAnomaly(amperage > AMPS_THRESHOLD)
  }, [amperage])

  // Reactive Logging: Trigger [CRITICAL] log when amperage crosses threshold
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
    const interval = setInterval(() => {
      const time = Date.now() / 1000
      
      // Smoother, organic fluctuation
      const vDrift = Math.sin(time) * 0.002
      
      setVoltage(3.3 + vDrift)
      
      setAmperage((prev) => {
        // Only apply organic drift if NOT in an active breach spike
        if (prev > AMPS_THRESHOLD) {
           return 0.8 + (Math.random() - 0.5) * 0.1 // Active Breach Jitter
        }
        // Idle Calibration: amperage stays between 0.395A and 0.403A
        // Centered around 0.399 with 0.004 amplitude
        const aDrift = Math.sin(time * 1.2) * 0.004
        return 0.399 + aDrift 
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const injectAnomaly = useCallback(() => {
    setAmperage(0.85) // Triggers isAnomaly via useEffect
    console.log('[SYSTEM]: Unidentified Power Spike detected in Silicon Sector 7-G.')
    
    // Auto-reset after 1.5 seconds (Cooldown Protocol)
    setTimeout(() => {
      setAmperage(0.399)
    }, 1500)
  }, [])

  const resetAnomaly = useCallback(() => {
    setAmperage(0.399)
  }, [])

  return (
    <HardwareContext.Provider value={{ voltage, amperage, isAnomaly, injectAnomaly, resetAnomaly }}>
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

'use client'
import { useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import {
  Activity,
  ChevronRight,
  Cpu,
  Shield,
  Send,
  Terminal,
  Waves,
  Zap,
  Radio,
  CheckCircle,
  Database,
  Lock,
  Wifi,
  BarChart3,
  Globe2
} from 'lucide-react'
import { HardwareProvider, useHardware } from '../context/HardwareContext'
import SiliconCanvas from '../components/hardware/SiliconCanvas'

export default function Home() {
  return (
    <HardwareProvider>
      <DashboardContent />
    </HardwareProvider>
  )
}

function DashboardContent() {
  const [agents, setAgents] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [task, setTask] = useState('')
  const [loading, setLoading] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  const { isAnomaly, voltage, amperage } = useHardware()

  const threatMetrics = useMemo(() => {
    const base = [
      { subject: 'Infiltration Risk', A: 90 },
      { subject: 'Data Integrity', A: 90 },
      { subject: 'Hardware Stability', A: isAnomaly ? 30 : 95 },
    ]
    return base
  }, [isAnomaly])

  useEffect(() => {
    async function init() {
      const { data: a } = await supabase.from('agents').select('*')
      if (a) setAgents(a)
      refreshLogs()
    }
    init()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_logs' }, () => {
        refreshLogs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const refreshLogs = async () => {
    const { data: l } = await supabase
      .from('mission_logs')
      .select('*, missions(title)')
      .order('created_at', { ascending: false })
      .limit(15)
    if (l) setLogs(l)
  }

  const generateRandomMetrics = () => {
    return [
      { subject: 'Infiltration Risk', A: Math.floor(Math.random() * (95 - 60 + 1) + 60) },
      { subject: 'Data Integrity', A: Math.floor(Math.random() * (95 - 60 + 1) + 60) },
      { subject: 'Hardware Stability', A: Math.floor(Math.random() * (95 - 60 + 1) + 60) },
    ];
  }

  const startMission = async () => {
    if (!task) return
    setLoading(true)
    
    try {
      const res = await fetch('/api/mission', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task,
          voltage: voltage,     
          amperage: amperage,   
          isAnomaly: isAnomaly  
        })
      })

      if (res.ok) {
        setTask('')
        setTimeout(refreshLogs, 1000)
      }
    } catch (error) {
      console.error("Mission deployment failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const activeAgents = agents.length
  const latestLog = logs[0]
  const onlinePulse = latestLog ? 'bg-emerald-400' : 'bg-red-500'
  const sysHealth = activeAgents > 0 ? '99.9%' : '84.2%'

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#020202] text-zinc-300 font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-radial-glow opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        
        {/* ── HEADER NAVIGATION ── */}
        <motion.nav 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6 }}
          className="mb-8 glass-panel flex flex-col gap-5 rounded-[20px] px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 ring-1 ring-emerald-500/30 animate-float shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Shield className="h-6 w-6 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">Command Hub</p>
              <h1 className="text-2xl font-bold tracking-tight text-white/90 drop-shadow-md">Ghost Ops</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[
              { icon: <Wifi className="h-3.5 w-3.5" />, label: 'Network', value: `${sysHealth}`, color: 'text-white' },
              { icon: <Database className="h-3.5 w-3.5" />, label: 'Logs', value: String(logs.length), color: 'text-white' },
              {
                icon: <Radio className="h-3.5 w-3.5" />,
                label: 'Telemetry',
                value: latestLog ? 'Live' : 'Standby',
                color: latestLog ? 'text-emerald-400' : 'text-zinc-500',
                dot: true,
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#0a0a0a]/50 px-4 py-2.5 backdrop-blur-md transition-all hover:bg-white/[0.03]">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-zinc-400">
                  {s.icon}
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{s.label}</p>
                  <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-bold tracking-wide ${s.color}`}>
                    {s.dot && (
                      <span className={`relative inline-block h-1.5 w-1.5 rounded-full ${latestLog ? 'bg-emerald-400 pulse-dot' : 'bg-red-500'}`} />
                    )}
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.nav>

        {/* ── BENTO GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* ─────── LEFT PANEL (4 cols) ─────── */}
          <div className="flex flex-col gap-6 md:col-span-5 lg:col-span-4">

            {/* Mission Entry Bento */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card rounded-[24px] p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 pointer-events-none">
                <div className="h-16 w-16 bg-emerald-500/10 blur-[30px] rounded-full" />
              </div>

              <div className="mb-6 flex items-start justify-between relative z-10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    Mission Control
                  </h2>
                  <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-widest">Deploy Objective</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur" />
                  <div className="relative flex items-center bg-[#111111] rounded-xl border border-white/10 overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                    <div className="pl-4 text-emerald-500">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <input
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !loading) startMission() }}
                      placeholder="Initialize scan..."
                      className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={startMission}
                  disabled={loading}
                  className="glow-btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-3.5 text-sm font-bold text-emerald-950 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-300/20"
                >
                  {loading ? (
                    <Activity className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                  ) : (
                    <>
                      Execute Directive
                      <Send className="h-4 w-4" strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 flex justify-between items-end border-t border-white/[0.05] pt-5 relative z-10">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Protocol</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <Lock className="h-3 w-3" /> Encrypted
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Last Sync</p>
                  <p className="mt-1 text-xs font-bold text-white/80 font-mono tracking-wider">
                    {latestLog ? new Date(latestLog.created_at).toLocaleTimeString() : '--:--:--'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Active Agents Bento */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card flex-1 rounded-[24px] p-6 flex flex-col"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Active Nodes</h2>
                  <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-widest">Operational Agents</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                  <span className={`relative inline-block h-1.5 w-1.5 rounded-full ${onlinePulse} pulse-dot`} />
                  {activeAgents} ONLINE
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="group relative flex items-center justify-between rounded-[16px] border border-white/[0.04] bg-[#111111]/80 px-4 py-3 transition-all hover:bg-[#1a1a1a] hover:border-white/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 rounded-[16px] transition-opacity pointer-events-none" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 shadow-inner">
                        <Cpu className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-wide text-white">{agent.name}</p>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{agent.role}</p>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <CheckCircle className="h-4 w-4 text-emerald-500/80" />
                    </div>
                  </div>
                ))}

                {agents.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center rounded-[16px] border border-dashed border-white/10 py-10 text-center">
                    <Globe2 className="h-6 w-6 text-zinc-700 mb-2" />
                    <p className="text-xs uppercase tracking-widest text-zinc-600 font-bold">No Active Nodes</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Threat Matrix Bento */}
            <motion.div 
               initial={{ x: -20, opacity: 0 }} 
               animate={{ x: 0, opacity: 1 }} 
               transition={{ duration: 0.6, delay: 0.3 }}
               className="glass-card flex-1 rounded-[2.5rem] p-6 flex flex-col bg-zinc-900/40 relative overflow-hidden"
             >
               <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
               <div className="mb-5 flex items-center justify-between relative z-10">
                 <div>
                   <h2 className="text-lg font-bold text-emerald-500">Threat Matrix</h2>
                   <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-widest">Tactical Radar</p>
                 </div>
               </div>
               <div className="w-full relative z-10 flex-1 min-h-[192px] -ml-2">
                 <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                   <RadarChart data={threatMetrics} outerRadius="70%">
                     <PolarGrid stroke="rgba(255,255,255,0.1)" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar name="Threat Level" dataKey="A" stroke="rgba(16,185,129,0.5)" fill="rgba(16,185,129,0.2)" fillOpacity={0.6} />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
             </motion.div>

            {/* Digital Twin Telemetry Bento */}
            <motion.div 
               initial={{ x: -20, opacity: 0 }} 
               animate={{ x: 0, opacity: 1 }} 
               transition={{ duration: 0.6, delay: 0.4 }}
               className="glass-card flex-1 rounded-[2.5rem] p-6 flex flex-col bg-zinc-900/20 relative overflow-hidden group/tile"
             >
               <div className="mb-5 flex items-center justify-between relative z-10">
                 <div>
                   <h2 className="text-lg font-bold text-white">Digital Twin</h2>
                   <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-widest">Physical Layer</p>
                 </div>
                 <AnomalyControl />
               </div>

               <div className="relative flex-1 min-h-[300px] rounded-2xl border border-white/5 bg-black/40 overflow-hidden shadow-2xl">
                 <SiliconCanvas />
                 <TelemetryOverlay />
               </div>
             </motion.div>
          </div>

          {/* ─────── RIGHT PANEL (8 cols) ─────── */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-7 lg:col-span-8 flex"
          >
            <div className="glass-panel flex h-[780px] w-full flex-col rounded-[24px] overflow-hidden drop-shadow-2xl">

              {/* Terminal Header Bar */}
              <div className="relative flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide">Live Telemetry</h2>
                    <p className="text-[10px] font-mono text-zinc-500">Forensic-grade capture active</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-right flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-zinc-500" />
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-600">Integrity</span>
                      <p className="text-xs font-mono font-bold text-white">100.0%</p>
                    </div>
                  </div>
                  <div className="w-[1px] h-6 bg-white/10"></div>
                  <div className="text-right flex items-center gap-2">
                    <Waves className="h-3.5 w-3.5 text-emerald-500" />
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-600">Stream</span>
                      <p className="text-xs font-mono font-bold text-emerald-400">Secure</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Log Canvas */}
              <div ref={feedRef} className="tactical-scroll relative flex-1 overflow-y-auto bg-[#050505]/90 p-6">
                <div className="scanline-overlay absolute inset-0 z-10 opacity-[0.15]" />
                
                <div className="relative z-20 space-y-4">
                  <AnimatePresence>
                    {logs.map((log, idx) => {
                      const displayId = (logs.length - idx).toString().padStart(3, '0');
                      return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="group flex gap-4 font-mono text-[13px]"
                      >
                        {/* Timeline Track */}
                        <div className="relative flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 z-10 my-1.5 ${
                            idx === 0 && log.agent_name !== 'Agent_Gamma' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                            : log.agent_name === 'Agent_Gamma' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-emerald-500/30'
                          }`} />
                          <div className={`w-[2px] h-full absolute top-4 group-last:hidden ${
                            log.agent_name === 'Agent_Gamma' ? 'bg-amber-500/20' : 'bg-emerald-500/10'
                          }`} />
                        </div>

                        {/* Content Card */}
                        <div className={`flex-1 rounded-[16px] border px-5 py-4 backdrop-blur-sm transition-all hover:bg-[#151515]/80 ${
                          log.agent_name === 'Agent_Gamma' 
                          ? 'bg-[#201004]/50 border-amber-500/30 text-amber-500' 
                          : 'bg-[#111111]/60 border-white/[0.04] hover:border-white/10'
                        }`}>
                          <div className={`mb-2 flex flex-wrap items-center justify-between gap-2 border-b pb-2 ${
                            log.agent_name === 'Agent_Gamma' ? 'border-amber-500/10' : 'border-white/5'
                          }`}>
                            <div className="flex items-center gap-2.5 text-[11px] font-bold">
                              <span className={`text-[10px] font-mono ${log.agent_name === 'Agent_Gamma' ? 'text-amber-500/80' : 'text-zinc-600'}`}>
                                #{displayId}
                              </span>
                              <span className={`text-[10px] border px-2 py-0.5 rounded uppercase font-bold ${
                                log.agent_name === 'Agent_Gamma' 
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' 
                                : 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20'
                              }`}>
                                {log.agent_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                              <span className="hidden sm:inline bg-zinc-900 rounded-md px-2 py-0.5 border border-white/5">
                                {log.missions?.title || 'Execution Stream'}
                              </span>
                              <span>
                                {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                              </span>
                            </div>
                          </div>
                          <p className="leading-relaxed text-zinc-300 font-mono text-xs whitespace-pre-wrap">
                            {log.output_data || log.input_data || 'No data chunk received.'}
                          </p>
                        </div>
                      </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {logs.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                      <div className="h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl absolute" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-[#111111]">
                        <Activity className="h-6 w-6 text-zinc-600" />
                      </div>
                      <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Feed Empty</p>
                      <p className="mt-2 text-xs text-zinc-600 font-sans max-w-[240px]">
                        Awaiting commands. Initiate a new deployment in Mission Control to commence telemetry.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  )
}

function AnomalyControl() {
  const { injectAnomaly, isAnomaly, voltage, amperage } = useHardware()

  const handleTrigger = async () => {
    injectAnomaly()
  }

  return (
    <button
      onClick={handleTrigger}
      disabled={isAnomaly}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-50 ${
        isAnomaly 
        ? 'border-red-500/50 bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
        : 'border-white/10 bg-white/5 text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-400'
      }`}
      title="Inject Power Spike Anomaly"
    >
      <Zap className={`h-5 w-5 ${isAnomaly ? 'animate-pulse' : ''}`} />
    </button>
  )
}

function TelemetryOverlay() {
  const { voltage, amperage, isAnomaly } = useHardware()
  return (
    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-none">Voltage</span>
        <span className={`font-mono text-lg font-bold tracking-tight leading-none ${isAnomaly ? 'text-red-500' : 'text-white'}`}>
          {voltage.toFixed(3)}V
        </span>
      </div>
      <div className="flex flex-col gap-1 text-right">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-none">Amperage</span>
        <span className={`font-mono text-lg font-bold tracking-tight leading-none ${isAnomaly ? 'text-orange-500' : 'text-emerald-400'}`}>
          {amperage.toFixed(3)}A
        </span>
      </div>
    </div>
  )
}

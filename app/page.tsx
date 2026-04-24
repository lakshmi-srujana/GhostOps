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
  Globe2,
  Fingerprint
} from 'lucide-react'
import { HardwareProvider, useHardware } from '../context/HardwareContext'
import SiliconCanvas from '../components/hardware/SiliconCanvas'
import { usePassport } from '../hooks/usePassport'
import { SiliconPassport } from '../lib/silicon-passport'

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

  const hardwareId = 'ghostops-riscv-core-alpha-7g'
  const [registeredBlockchainId, setRegisteredBlockchainId] = useState('')

  useEffect(() => {
    let active = true

    async function registerPassport() {
      const fingerprint = await SiliconPassport.generateFingerprint(hardwareId)
      const blockchainId = await SiliconPassport.deriveBlockchainId(fingerprint)

      if (active) {
        setRegisteredBlockchainId(blockchainId)
      }
    }

    registerPassport().catch((error) => {
      console.error('Failed to register passport identity:', error)
    })

    return () => {
      active = false
    }
  }, [hardwareId])

  const { fingerprint, blockchainId, anchorRecord, verificationStatus } = usePassport({
    hardwareId,
    registeredBlockchainId,
  })

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
  const statusCards = [
    { icon: <Wifi className="h-3.5 w-3.5" />, label: 'Network', value: `${sysHealth}`, color: 'text-white' },
    { icon: <Database className="h-3.5 w-3.5" />, label: 'Logs', value: String(logs.length), color: 'text-white' },
    {
      icon: <Radio className="h-3.5 w-3.5" />,
      label: 'Telemetry',
      value: latestLog ? 'Live' : 'Standby',
      color: latestLog ? 'text-emerald-400' : 'text-zinc-500',
      dot: true,
    },
  ]

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#020202] text-zinc-300 font-sans relative flex flex-col">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-radial-glow opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

      {/* ── HEADER NAVIGATION ── */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.6 }}
        className="relative z-10 glass-panel rounded-0 m-0 px-6 py-3 border-b border-white/5 shrink-0"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 ring-1 ring-emerald-500/30 animate-float shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Shield className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">Command Hub</p>
            <h1 className="text-xl font-bold tracking-tight text-white/90 drop-shadow-md">Ghost Ops</h1>
          </div>
        </div>
      </motion.nav>

      {/* ── THREE-COLUMN GRID ── */}
      <div className="relative z-10 flex-1 overflow-hidden grid grid-cols-[280px_1fr_320px] gap-4 p-4">

        {/* ═════ LEFT COLUMN (280px) ═════ */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          
          {/* Network Stats */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="glass-panel rounded-[16px] p-3 shrink-0"
          >
            <div className="grid grid-cols-1 gap-2">
              {statusCards.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-[#0a0a0a]/60 px-2 py-1.5 backdrop-blur-md transition-all hover:bg-white/[0.03]"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-zinc-400 flex-shrink-0">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500 truncate">{s.label}</p>
                    <p className={`mt-0.5 flex items-center gap-1 text-xs font-bold tracking-tight truncate ${s.color}`}>
                      {s.dot && (
                        <span className={`relative inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${latestLog ? 'bg-emerald-400 pulse-dot' : 'bg-red-500'}`} />
                      )}
                      <span className="truncate">{s.value}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Silicon Passport */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="glass-panel rounded-[16px] p-3 flex-1 overflow-y-auto"
          >
            <div className="relative z-10">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                    <Fingerprint className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">Passport</span>
                  </h2>
                  <p className="mt-1 text-[7px] font-medium uppercase tracking-widest text-zinc-500 truncate">
                    PUF + ledger
                  </p>
                </div>
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] flex-shrink-0 whitespace-nowrap ${
                    verificationStatus === 'verified'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : verificationStatus === 'mismatch'
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : verificationStatus === 'error'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-white/10 bg-white/5 text-zinc-400'
                  }`}
                >
                  {verificationStatus}
                </span>
              </div>

              <div className="space-y-1.5 text-[9px]">
                <PassportRow label="Hardware ID" value={hardwareId} />
                <PassportRow label="Fingerprint" value={fingerprint} truncateAsHash />
                <PassportRow label="DID" value={blockchainId} truncateAsHash />
                <PassportRow label="Registered" value={registeredBlockchainId || null} truncateAsHash />
                <PassportRow label="Anchor Tx" value={anchorRecord?.transactionHash ?? null} truncateAsHash />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═════ CENTER COLUMN (1fr) ═════ */}
        <div className="flex flex-col overflow-hidden">
          {/* Live Telemetry Terminal */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-panel flex h-full w-full flex-col rounded-[16px] overflow-hidden"
          >
            {/* Terminal Header Bar */}
            <div className="relative flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 px-4 py-2 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white tracking-wide truncate">Live Telemetry</h2>
                  <p className="text-[8px] font-mono text-zinc-500 truncate">Forensic-grade capture active</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[9px]">
                <div className="text-right flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3 text-zinc-500" />
                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[0.15em] text-zinc-600">Integrity</span>
                    <p className="text-xs font-mono font-bold text-white">100.0%</p>
                  </div>
                </div>
                <div className="w-[1px] h-5 bg-white/10"></div>
                <div className="text-right flex items-center gap-1.5">
                  <Waves className="h-3 w-3 text-emerald-500" />
                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[0.15em] text-zinc-600">Stream</span>
                    <p className="text-xs font-mono font-bold text-emerald-400">Secure</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Log Canvas */}
            <div ref={feedRef} className="tactical-scroll relative flex-1 overflow-y-auto bg-[#050505]/90 p-4">
              <div className="scanline-overlay absolute inset-0 z-10 opacity-[0.15]" />
              
              <div className="relative z-20 space-y-3">
                <AnimatePresence>
                  {logs.map((log, idx) => {
                    const displayId = (logs.length - idx).toString().padStart(3, '0');
                    return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="group flex gap-3 font-mono text-[11px]"
                    >
                      {/* Timeline Track */}
                      <div className="relative flex flex-col items-center flex-shrink-0">
                        <div className={`h-2 w-2 rounded-full z-10 my-1 ${
                          idx === 0 && log.agent_name !== 'Agent_Gamma' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                          : log.agent_name === 'Agent_Gamma' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'bg-emerald-500/30'
                        }`} />
                        <div className={`w-[1.5px] h-full absolute top-3 group-last:hidden ${
                          log.agent_name === 'Agent_Gamma' ? 'bg-amber-500/20' : 'bg-emerald-500/10'
                        }`} />
                      </div>

                      {/* Content Card */}
                      <div className={`flex-1 rounded-[12px] border px-3 py-2 backdrop-blur-sm transition-all hover:bg-[#151515]/80 ${
                        log.agent_name === 'Agent_Gamma' 
                        ? 'bg-[#201004]/50 border-amber-500/30 text-amber-500' 
                        : 'bg-[#111111]/60 border-white/[0.04] hover:border-white/10'
                      }`}>
                        <div className={`mb-1.5 flex flex-wrap items-center justify-between gap-1.5 border-b pb-1.5 ${
                          log.agent_name === 'Agent_Gamma' ? 'border-amber-500/10' : 'border-white/5'
                        }`}>
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className={`text-[9px] font-mono ${log.agent_name === 'Agent_Gamma' ? 'text-amber-500/80' : 'text-zinc-600'}`}>
                              #{displayId}
                            </span>
                            <span className={`text-[9px] border px-1.5 py-0.5 rounded uppercase font-bold ${
                              log.agent_name === 'Agent_Gamma' 
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' 
                              : 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20'
                            }`}>
                              {log.agent_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                            <span className="hidden sm:inline bg-zinc-900 rounded-md px-1.5 py-0.5 border border-white/5 truncate">
                              {log.missions?.title || 'Execution Stream'}
                            </span>
                            <span className="flex-shrink-0">
                              {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                            </span>
                          </div>
                        </div>
                        <p className="leading-relaxed text-zinc-300 font-mono text-[10px] whitespace-pre-wrap break-words">
                          {log.output_data || log.input_data || 'No data chunk received.'}
                        </p>
                      </div>
                    </motion.div>
                    );
                  })}
                </AnimatePresence>

                {logs.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
                    <div className="h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl absolute" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-[#111111]">
                      <Activity className="h-5 w-5 text-zinc-600" />
                    </div>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Feed Empty</p>
                    <p className="mt-1.5 text-[10px] text-zinc-600 font-sans max-w-[180px]">
                      Awaiting commands. Execute a directive to commence telemetry.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═════ RIGHT COLUMN (320px) ═════ */}
        <div className="flex flex-col gap-4 overflow-y-auto">

          {/* Mission Control */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-card rounded-[16px] p-3 shrink-0"
          >
            <div className="mb-3 relative z-10">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Mission Control</span>
              </h2>
              <p className="mt-0.5 text-[8px] font-medium text-zinc-500 uppercase tracking-widest truncate">Deploy Objective</p>
            </div>

            <div className="space-y-2.5 relative z-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur" />
                <div className="relative flex items-center bg-[#111111] rounded-lg border border-white/10 overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                  <div className="pl-3 text-emerald-500">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                  <input
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading) startMission() }}
                    placeholder="Initialize scan..."
                    className="w-full bg-transparent px-2 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={startMission}
                disabled={loading}
                className="glow-btn flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 py-2 text-xs font-bold text-emerald-950 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-300/20"
              >
                {loading ? (
                  <Activity className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <>
                    Execute
                    <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex justify-between items-end border-t border-white/[0.05] pt-2 relative z-10 text-[8px]">
              <div className="min-w-0">
                <p className="font-bold uppercase tracking-[0.15em] text-zinc-600">Protocol</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <Lock className="h-2.5 w-2.5 flex-shrink-0" /> Encrypted
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase tracking-[0.15em] text-zinc-600">Last Sync</p>
                <p className="mt-0.5 text-[9px] font-bold text-white/80 font-mono tracking-wider whitespace-nowrap">
                  {latestLog ? new Date(latestLog.created_at).toLocaleTimeString() : '--:--:--'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Digital Twin */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card rounded-[16px] p-3 flex-1 flex flex-col bg-zinc-900/20 relative overflow-hidden group/tile min-h-0"
          >
            <div className="mb-2 flex items-center justify-between relative z-10 shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white truncate">Digital Twin</h2>
                <p className="mt-0.5 text-[8px] font-medium text-zinc-500 uppercase tracking-widest truncate">Physical Layer</p>
              </div>
              <AnomalyControl />
            </div>

            <div className="relative flex-1 rounded-xl border border-white/5 bg-black/40 overflow-hidden shadow-2xl min-h-0" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
              <SiliconCanvas />
              <TelemetryOverlay />
            </div>
          </motion.div>

          {/* Threat Matrix */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-card rounded-[16px] p-3 flex-1 flex flex-col bg-zinc-900/40 relative overflow-hidden min-h-0"
          >
            <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
            <div className="mb-2 flex items-center justify-between relative z-10 shrink-0">
              <h2 className="text-sm font-bold text-emerald-500">Threat Matrix</h2>
            </div>
            <div className="w-full relative z-10 flex-1 min-h-0 -ml-2" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={120}>
                <RadarChart data={threatMetrics} outerRadius="70%">
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Threat Level" dataKey="A" stroke="rgba(16,185,129,0.5)" fill="rgba(16,185,129,0.2)" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

      </div>
    </main>
  )
}

function PassportRow({
  label,
  value,
  truncateAsHash = false,
}: {
  label: string
  value: string | null
  truncateAsHash?: boolean
}) {
  const displayValue = value
    ? truncateAsHash
      ? truncateHash(value)
      : value
    : 'Initializing...'

  return (
    <div className="rounded-lg border border-white/5 bg-[#111111]/75 px-2 py-1.5">
      <p className="text-[7px] font-bold uppercase tracking-[0.14em] text-zinc-500 truncate">{label}</p>
      <p className="mt-0.5 break-all font-mono text-[8px] text-zinc-200 truncate">{displayValue}</p>
    </div>
  )
}

function truncateHash(value: string) {
  if (!value) {
    return value
  }

  const normalized = value.startsWith('0x') ? value : `0x${value}`
  return `${normalized.slice(0, 5)}...${normalized.slice(-2)}`
}

function AnomalyControl() {
  const { toggleAnomaly, isAnomaly } = useHardware()

  return (
    <button
      onClick={toggleAnomaly}
      aria-pressed={isAnomaly}
      className={`relative flex h-8 min-w-[100px] items-center justify-center gap-1.5 rounded-lg border px-2 transition-all active:scale-95 flex-shrink-0 ${
        isAnomaly 
        ? 'border-red-500/50 bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
        : 'border-white/10 bg-white/5 text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-400'
      }`}
      title={isAnomaly ? 'Deactivate Power Spike Anomaly' : 'Inject Power Spike Anomaly'}
    >
      <Zap className={`h-4 w-4 flex-shrink-0 ${isAnomaly ? 'animate-pulse' : ''}`} />
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] truncate">
        {isAnomaly ? 'Spike On' : 'Spike Off'}
      </span>
    </button>
  )
}

function TelemetryOverlay() {
  const { voltage, amperage, isAnomaly } = useHardware()
  return (
    <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md pointer-events-none">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-500">Telemetry</span>
        <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] flex-shrink-0 ${
          isAnomaly
            ? 'border-red-500/40 bg-red-500/15 text-red-400'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
        }`}>
          {isAnomaly ? 'Spike' : 'Nominal'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-500 leading-none">Voltage</span>
          <span className={`font-mono text-sm font-bold tracking-tight leading-none ${isAnomaly ? 'text-red-500' : 'text-white'}`}>
            {voltage.toFixed(2)}V
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-500 leading-none">Amperage</span>
          <span className={`font-mono text-sm font-bold tracking-tight leading-none ${isAnomaly ? 'text-orange-500' : 'text-emerald-400'}`}>
            {amperage.toFixed(2)}A
          </span>
        </div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            isAnomaly ? 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
          }`}
          style={{ width: `${isAnomaly ? 92 : 41}%` }}
        />
      </div>
    </div>
  )
}

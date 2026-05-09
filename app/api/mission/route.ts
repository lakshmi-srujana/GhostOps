import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generateAgentResponse } from '../../../lib/github-models'

type MissionRequest = {
  task?: string
  voltage?: number
  amperage?: number
  isAnomaly?: boolean
  isDeceptionActive?: boolean
  hardwareStatus?: {
    voltage?: number
    amperage?: number
    isAnomaly?: boolean
  }
}

// Configuration Constants
const CONFIG = {
  DEFAULT_VOLTAGE: 3.3,
  DEFAULT_AMPERAGE: 0.399,
  VOLTAGE_SPIKE_THRESHOLD: 4.2,
  AMPERAGE_SPIKE_THRESHOLD: 0.65,
  STREAM_DELAY_MS: 300,
}

function auditTimestamp() {
  const now = new Date()
  const microseconds = `${performance.now().toFixed(3)}`.replace('.', '').slice(-6).padStart(6, '0')
  return `${now.toISOString().replace('Z', '')}${microseconds.slice(3)}Z`
}

function classifyTelemetry(voltage: number, amperage: number, isAnomaly: boolean, isDeceptionActive: boolean) {
  const voltageSpike = voltage >= CONFIG.VOLTAGE_SPIKE_THRESHOLD
  const amperageSpike = amperage >= CONFIG.AMPERAGE_SPIKE_THRESHOLD
  const trapTrip = isDeceptionActive
  const observed = isAnomaly || voltageSpike || amperageSpike || trapTrip

  return {
    observed,
    voltageSpike,
    amperageSpike,
    trapTrip,
    status: observed ? 'AUDIT_EVENT' : 'NOMINAL',
    integrity: isAnomaly ? 'DISTORTED' : 'STABLE',
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatForensicLog(agentId: string, status: string, insight: string) {
  return `[${auditTimestamp()}] [${agentId}] [${status}]: ${insight}`
}

async function writeMissionLog(
  missionId: string,
  agentName: string,
  outputData: string,
  inputData?: string
) {
  if (!supabaseAdmin) return

  const { error } = await supabaseAdmin
    .from('mission_logs')
    .insert([{
      mission_id: missionId,
      agent_name: agentName,
      input_data: inputData,
      output_data: outputData,
    }])

  if (error) {
    console.error(`[SUPABASE ERROR] Log write failed for ${agentName}:`, error.message)
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Route is ALIVE',
    provider: 'GitHub Models / Supabase',
    sequence: ['API_FETCH', 'Agent_Alpha', 'Agent_Beta', 'Agent_Gamma', 'CONSENSUS_PROTOCOL'],
  })
}

export async function POST(req: Request) {
  let missionId: string | undefined

  try {
    const body = (await req.json()) as MissionRequest
    const task = body.task?.trim()

    if (!task) {
      return NextResponse.json({ error: 'Mission task is required.' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error: missing Supabase service key.' }, { status: 500 })
    }

    const voltage = body.voltage ?? body.hardwareStatus?.voltage ?? CONFIG.DEFAULT_VOLTAGE
    const amperage = body.amperage ?? body.hardwareStatus?.amperage ?? CONFIG.DEFAULT_AMPERAGE
    const requestedAnomaly = body.isAnomaly ?? body.hardwareStatus?.isAnomaly ?? false
    const isDeceptionActive = body.isDeceptionActive ?? false
    const telemetry = classifyTelemetry(voltage, amperage, requestedAnomaly, isDeceptionActive)
    const isAnomaly = telemetry.observed

    // 1. Create Mission
    const { data: missionData, error: missionError } = await supabaseAdmin
      .from('missions')
      .insert([{ title: task, status: 'executing' }])
      .select()

    if (missionError) {
      console.error('[SUPABASE ERROR] Mission creation failed:', missionError.message)
      return NextResponse.json({ error: `Mission Creation Failed: ${missionError.message}` }, { status: 500 })
    }

    missionId = missionData?.[0]?.id
    if (!missionId) {
      return NextResponse.json({ error: 'Mission creation failed to return data.' }, { status: 500 })
    }

    // 2. Initial Fetch Log
    await writeMissionLog(
      missionId,
      'API_FETCH',
      formatForensicLog(
        'API_FETCH',
        'NOMINAL',
        `Directive received. Initialization sequence start. Query="${task}". Hardware context V=${voltage.toFixed(3)}V A=${amperage.toFixed(3)}A Integrity=${telemetry.integrity}.`
      )
    )

    // 3. Deception Log
    if (isDeceptionActive) {
      await sleep(CONFIG.STREAM_DELAY_MS)
      await writeMissionLog(
        missionId,
        'AGENT_HONEY',
        formatForensicLog(
          'AGENT_HONEY',
          'DECEPTION',
          'GHOST-REG canary read and DECEPTIVE-RAIL lure path tripped. Purple deception channel active; restricted interaction preserved in forensic stream.'
        )
      )
    }

    // 4. Sequential Agent Analysis (Real LLM Calls)
    const agents = [
      { name: 'Agent_Alpha', role: 'Voltage/PUF telemetry analyst' },
      { name: 'Agent_Beta', role: 'Timing/Frequency health analyst' },
      { name: 'Agent_Gamma', role: 'Logic/Canary remediation analyst' },
    ]

    for (const agent of agents) {
      await sleep(CONFIG.STREAM_DELAY_MS)
      const report = await generateAgentResponse(agent.name, agent.role, task, {
        voltage,
        amperage,
        isAnomaly,
        isDeceptionActive
      })
      await writeMissionLog(missionId, agent.name, report)
    }

    // 5. Consensus Protocol (Real LLM Call)
    await sleep(CONFIG.STREAM_DELAY_MS)
    const consensusReport = await generateAgentResponse(
      'CONSENSUS_PROTOCOL',
      'Forensic Consensus Manager',
      `Review findings and provide a final decision. If system integrity is confirmed, include the tag [VERIFIED CONSENSUS] in your report. Directive: ${task}`,
      { voltage, amperage, isAnomaly, isDeceptionActive }
    )
    await writeMissionLog(missionId, 'CONSENSUS_PROTOCOL', consensusReport)

    // 6. Update Mission Status
    const { error: updateError } = await supabaseAdmin
      .from('missions')
      .update({ 
        status: 'completed',
        metadata: {
          consensusStatus: 'reached',
          consensusFlag: '[CONSENSUS REACHED]',
          agentAlignment: '3/3',
          isAnomaly,
          isDeceptionActive,
          completedAt: new Date().toISOString(),
        },
      })
      .eq('id', missionId)

    if (updateError) {
      console.error('[SUPABASE ERROR] Final update failed:', updateError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Mission completed successfully',
      missionId,
      provider: 'GitHub Models GPT-4o',
      consensus: {
        flag: '[CONSENSUS REACHED]',
        status: 'reached',
        voteCount: 3,
      },
    })
  } catch (error: any) {
    console.error('CRITICAL MISSION FAILURE:', error?.message || error)
    
    if (missionId && supabaseAdmin) {
      await supabaseAdmin
        .from('missions')
        .update({ status: 'failed' })
        .eq('id', missionId)
        .catch(err => console.error('Failed to update mission to failed status:', err.message))
    }

    return NextResponse.json(
      { error: error?.message || 'Mission failed.' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import ModelClient from '@azure-rest/ai-inference'
import { AzureKeyCredential } from '@azure/core-auth'

import { supabaseAdmin } from '../../../lib/supabase'

type MissionRequest = {
  task?: string
  voltage?: number
  amperage?: number
  isAnomaly?: boolean
  hardwareStatus?: {
    voltage?: number
    amperage?: number
    isAnomaly?: boolean
  }
}

const githubToken = process.env.GITHUB_TOKEN
const githubModel = process.env.GITHUB_MODEL || 'gpt-4o'

const client = githubToken
  ? ModelClient(
      'https://models.inference.ai.azure.com',
      new AzureKeyCredential(githubToken)
    )
  : null

async function callGitHubModel(prompt: string, agentName: string): Promise<string> {
  if (!client) {
    throw new Error('Missing GITHUB_TOKEN in .env.local')
  }

  const response = await client.path('/chat/completions').post({
    body: {
      model: githubModel,
      messages: [
        {
          role: 'system',
          content:
            'You are a Ghost Ops hardware security agent. Prioritize current RAW_SENSOR_DATA over all previous context. If Status is BREACH, report hardware compromise immediately.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
    },
  })

  if (response.status !== '200') {
    const body = response.body as { error?: { message?: string }; message?: string }
    throw new Error(
      `${agentName} GitHub Models request failed: ${body?.error?.message || body?.message || response.status}`
    )
  }

  const body = response.body as {
    choices?: Array<{ message?: { content?: string | null } }>
  }

  return body.choices?.[0]?.message?.content?.trim() || `${agentName} returned no analysis.`
}

interface ConsensusAnalysis {
  alphaBreach: boolean
  betaThreatLevel: 'high' | 'medium' | 'low'
  gammaRemediationConfidence: boolean
  consensusFlag: string
  consensus: 'verified' | 'conflict'
}

function analyzeConsensus(
  alphaOutput: string,
  betaOutput: string,
  gammaOutput: string,
  isAnomaly: boolean
): ConsensusAnalysis {
  // Alpha: Check for BREACH or COMPROMISE keywords
  const alphaBreach =
    alphaOutput.toLowerCase().includes('breach') ||
    alphaOutput.toLowerCase().includes('compromise') ||
    alphaOutput.toLowerCase().includes('critical') ||
    isAnomaly

  // Beta: Assess threat level from output
  const betaLower = betaOutput.toLowerCase()
  let betaThreatLevel: 'high' | 'medium' | 'low' = 'medium'
  if (
    betaLower.includes('critical') ||
    betaLower.includes('imminent') ||
    betaLower.includes('severe') ||
    betaLower.includes('high risk')
  ) {
    betaThreatLevel = 'high'
  } else if (
    betaLower.includes('minimal') ||
    betaLower.includes('low risk') ||
    betaLower.includes('nominal')
  ) {
    betaThreatLevel = 'low'
  }

  // Gamma: Check for actionable remediation (contains specific fixes or guards)
  const gammaRemediationConfidence =
    gammaOutput.length > 30 && // Substantive response
    (gammaOutput.toLowerCase().includes('implement') ||
      gammaOutput.toLowerCase().includes('deploy') ||
      gammaOutput.toLowerCase().includes('guard') ||
      gammaOutput.toLowerCase().includes('isolate') ||
      gammaOutput.toLowerCase().includes('reset') ||
      gammaOutput.toLowerCase().includes('patch'))

  // Consensus logic
  const consensusMetrics = {
    alphaBreach,
    betaThreatHigh: betaThreatLevel === 'high',
    gammaActionable: gammaRemediationConfidence,
  }

  // VERIFIED CONSENSUS: All three agents agree (Alpha breach + Beta high threat + Gamma has fix)
  const verified =
    isAnomaly &&
    alphaBreach &&
    betaThreatLevel === 'high' &&
    gammaRemediationConfidence

  const consensusFlag = verified ? '[VERIFIED CONSENSUS]' : '[CONFLICT DETECTED - RE-SCANNING]'
  const consensus = verified ? 'verified' : 'conflict'

  return {
    alphaBreach,
    betaThreatLevel,
    gammaRemediationConfidence,
    consensusFlag,
    consensus,
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Route is ALIVE',
    provider: 'GitHub Models',
    model: githubModel,
    tokenConfigured: Boolean(githubToken),
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

    const voltage = body.voltage ?? body.hardwareStatus?.voltage ?? 3.3
    const amperage = body.amperage ?? body.hardwareStatus?.amperage ?? 0.399
    const isAnomaly = body.isAnomaly ?? body.hardwareStatus?.isAnomaly ?? false
    const status = isAnomaly ? 'BREACH' : 'NOMINAL'
    const telemetryString = `[RAW_SENSOR_DATA] V: ${voltage}, A: ${amperage}, Status: ${status}.`

    const { data: missionData, error: missionError } = await supabaseAdmin
      .from('missions')
      .insert([{ title: task, status: 'executing' }])
      .select()

    if (missionError) {
      return NextResponse.json({ error: `Mission Creation Failed: ${missionError.message}` }, { status: 500 })
    }

    missionId = missionData?.[0]?.id
    if (!missionId) {
      return NextResponse.json({ error: 'Mission creation failed to return data.' }, { status: 500 })
    }

    const { data: lastLogData } = await supabaseAdmin
      .from('mission_logs')
      .select('output_data')
      .order('created_at', { ascending: false })
      .limit(1)

    const lastLogLine = lastLogData?.[0]?.output_data || 'No previous logs found.'
    const sharedContext = `
${telemetryString}
Mission Objective: ${task}
Previous System Log: ${lastLogLine}
`

    const alphaOutput = await callGitHubModel(
      `${sharedContext}
You are Agent Alpha, the Ghost Ops Forensic Lead.
Analyze only the current telemetry and its forensic implications.
If Status is BREACH, you must report a physical hardware compromise.
Keep the response cold, clinical, and under 90 words.`,
      'Agent Alpha'
    )

    const betaOutput = await callGitHubModel(
      `${sharedContext}
Alpha Report: ${alphaOutput}
You are Agent Beta, a Strategic Analyst.
Provide a one-sentence threat assessment focused on risk level and immediate action.`,
      'Agent Beta'
    )

    const gammaOutput = await callGitHubModel(
      `${sharedContext}
Beta Assessment: ${betaOutput}
You are Agent Gamma, a Remediation Engineer.
Provide a two-sentence tactical countermeasure with one specific hardware fix or code-like guard.`,
      'Agent Gamma'
    )

    // ═══ CONSENSUS PROTOCOL ═══
    const consensusAnalysis = analyzeConsensus(alphaOutput, betaOutput, gammaOutput, isAnomaly)
    const consensusReportData = `${consensusAnalysis.consensusFlag}
[COLLECTIVE FORENSIC SUMMARY]
• Alpha Forensic: ${consensusAnalysis.alphaBreach ? 'BREACH CONFIRMED' : 'No physical compromise detected'}
• Beta Threat Assessment: ${consensusAnalysis.betaThreatLevel.toUpperCase()}
• Gamma Remediation: ${consensusAnalysis.gammaRemediationConfidence ? 'ACTIONABLE FIX PROVIDED' : 'Awaiting protocol clarification'}
Consensus: ${consensusAnalysis.consensus === 'verified' ? 'All agents in agreement' : 'Agent conflict - manual review recommended'}`

    const { error: logError } = await supabaseAdmin.from('mission_logs').insert([
      {
        mission_id: missionId,
        agent_name: 'Agent_Alpha',
        output_data: alphaOutput,
      },
      {
        mission_id: missionId,
        agent_name: 'Agent_Beta',
        input_data: alphaOutput,
        output_data: betaOutput,
      },
      {
        mission_id: missionId,
        agent_name: 'Agent_Gamma',
        input_data: betaOutput,
        output_data: gammaOutput,
      },
      {
        mission_id: missionId,
        agent_name: 'CONSENSUS_PROTOCOL',
        output_data: consensusReportData,
      },
    ])

    if (logError) {
      throw new Error(logError.message)
    }

    await supabaseAdmin.from('missions').update({ 
      status: 'completed',
      metadata: JSON.stringify({
        consensusStatus: consensusAnalysis.consensus,
        consensusFlag: consensusAnalysis.consensusFlag,
      })
    }).eq('id', missionId)

    return NextResponse.json({
      success: true,
      message: 'Mission data synced to Supabase',
      missionId,
      provider: 'GitHub Models',
      model: githubModel,
      consensus: {
        flag: consensusAnalysis.consensusFlag,
        status: consensusAnalysis.consensus,
        alphaBreach: consensusAnalysis.alphaBreach,
        betaThreatLevel: consensusAnalysis.betaThreatLevel,
        gammaActionable: consensusAnalysis.gammaRemediationConfidence,
      },
    })
  } catch (error: any) {
    if (missionId && supabaseAdmin) {
      await supabaseAdmin.from('missions').update({ status: 'failed' }).eq('id', missionId)
    }

    console.error('CRITICAL MISSION FAILURE:', error?.message || error)
    return NextResponse.json(
      { error: error?.message || 'Mission failed.' },
      { status: 500 }
    )
  }
}

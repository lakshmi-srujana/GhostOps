import { NextResponse } from 'next/server'

import { supabaseAdmin } from '../../../lib/supabase'

const SOFTWARE_AGENTS = [
  { id: 'software-alpha', name: 'Agent_Alpha', role: 'Voltage telemetry analyst' },
  { id: 'software-beta', name: 'Agent_Beta', role: 'Timing and health analyst' },
  { id: 'software-gamma', name: 'Agent_Gamma', role: 'Logic remediation analyst' },
]

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        agents: SOFTWARE_AGENTS,
        logs: [],
        warning: 'Missing Supabase service key; returning local software agents only.',
      },
      { status: 200 }
    )
  }

  const [{ data: agents, error: agentsError }, { data: logs, error: logsError }] = await Promise.all([
    supabaseAdmin.from('agents').select('*'),
    supabaseAdmin
      .from('mission_logs')
      .select('*, missions(title)')
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  if (agentsError || logsError) {
    return NextResponse.json(
      {
        agents: agents?.length ? agents : SOFTWARE_AGENTS,
        logs: logs || [],
        warning: agentsError?.message || logsError?.message,
      },
      { status: 200 }
    )
  }

  return NextResponse.json({
    agents: agents?.length ? agents : SOFTWARE_AGENTS,
    logs: logs || [],
  })
}

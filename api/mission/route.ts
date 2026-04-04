import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  return new Response(JSON.stringify({ status: "Mission Control is Online" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    // 1. Get the data from the frontend
    const body = await req.json();
    const { task } = body;
    
    console.log("--- MISSION INITIALIZED ---");
    console.log("Objective:", task);

    if (!supabaseAdmin) {
      console.error("ERROR: supabaseAdmin is null. Check your .env.local keys!");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 2. Create the Mission record
    const { data: missionData, error: missionError } = await supabaseAdmin
      .from('missions')
      .insert([{ title: task, status: 'executing' }])
      .select();

    if (missionError) {
      console.error("DATABASE ERROR (Missions):", missionError.message);
      return NextResponse.json({ error: missionError.message }, { status: 500 });
    }

    const missionId = missionData[0].id;
    console.log("Mission ID Created:", missionId);

    // 3. Create the first Log (The "Relay Race" starts)
    const { error: logError } = await supabaseAdmin
      .from('mission_logs')
      .insert([
        { 
          mission_id: missionId, 
          agent_name: 'Agent_Alpha', 
          output_data: `Target identified: ${task}. Initiating research phase...` 
        },
        { 
          mission_id: missionId, 
          agent_name: 'Agent_Beta', 
          input_data: `Research phase started`,
          output_data: `Standing by for Alpha's data on ${task}.` 
        }
      ]);

    if (logError) {
      console.error("DATABASE ERROR (Logs):", logError.message);
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    // 4. Update mission to 'completed'
    await supabaseAdmin
      .from('missions')
      .update({ status: 'completed' })
      .eq('id', missionId);

    console.log("--- MISSION SUCCESSFUL ---");
    return NextResponse.json({ 
      success: true, 
      message: "Mission data synced to Supabase",
      missionId: missionId 
    });

  } catch (error: any) {
    console.error("CRITICAL SYSTEM CRASH:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
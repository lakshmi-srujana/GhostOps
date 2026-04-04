import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function GET() {
  return new Response(JSON.stringify({ status: 'Route is ALIVE' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

console.log("DEBUG: Key is", process.env.GEMINI_API_KEY ? "FOUND ✅" : "MISSING ❌");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { task } = body;

    console.log('--- MISSION INITIALIZED ---');
    console.log('Objective:', task);

    if (!supabaseAdmin) {
      console.error('ERROR: supabaseAdmin is null. Check your .env.local keys!');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: missionData, error: missionError } = await supabaseAdmin
      .from('missions')
      .insert([{ title: task, status: 'executing' }])
      .select();

    if (missionError) {
      console.error('❌ DATABASE ERROR (Missions):', missionError.message, missionError.details);
      return NextResponse.json({ error: `Mission Creation Failed: ${missionError.message}` }, { status: 500 });
    }

    if (!missionData || missionData.length === 0) {
      console.error('❌ DATABASE ERROR: No mission data returned after insert.');
      return NextResponse.json({ error: 'Mission creation failed to return data.' }, { status: 500 });
    }

    const missionId = missionData[0].id;
    console.log('Mission ID Created:', missionId);

    console.log("Mission Starting: Sending to Gemini...");

    // --- AGENT ALPHA: RESEARCHER ---
    const alphaPrompt = `You are AGENT_ALPHA, a Lead Forensic Researcher. 
      Analyze this mission objective: "${task}". 
      Provide a 2-sentence technical reconnaissance report focusing on hardware or digital vulnerabilities. 
      Keep it cold, professional, and clinical.`;

    const alphaResult = await model.generateContent(alphaPrompt);
    const alphaOutput = alphaResult.response.text();

    console.log("Gemini Response Received! ✅");

    await supabaseAdmin.from('mission_logs').insert([{
      mission_id: missionId,
      agent_name: 'Agent_Alpha',
      output_data: alphaOutput
    }]);

    await new Promise(res => setTimeout(res, 2000)); // The "Relay" Delay

    // --- AGENT BETA: ANALYST ---
    const betaPrompt = `You are AGENT_BETA, a Strategic Analyst. 
      Based on this research from Alpha: "${alphaOutput}", 
      provide a 1-sentence strategic threat assessment. 
      Focus on the risk level and immediate action.`;

    const betaResult = await model.generateContent(betaPrompt);
    const betaOutput = betaResult.response.text();

    await supabaseAdmin.from('mission_logs').insert([{
      mission_id: missionId,
      agent_name: 'Agent_Beta',
      input_data: alphaOutput,
      output_data: betaOutput
    }]);

    await new Promise(res => setTimeout(res, 2000)); // The "Relay" Delay

    // --- AGENT GAMMA: REMEDIATION ENGINEER ---
    const gammaPrompt = `You are AGENT_GAMMA, a Remediation Engineer. 
      Based on this strategic threat assessment from Beta: "${betaOutput}", 
      provide a 2-sentence Tactical Countermeasure that includes a snippet of hypothetical security code or a specific hardware fix.`;

    const gammaResult = await model.generateContent(gammaPrompt);
    const gammaOutput = gammaResult.response.text();

    await supabaseAdmin.from('mission_logs').insert([{
      mission_id: missionId,
      agent_name: 'Agent_Gamma',
      input_data: betaOutput,
      output_data: gammaOutput
    }]);

    await supabaseAdmin.from('missions').update({ status: 'completed' }).eq('id', missionId);

    console.log('--- MISSION SUCCESSFUL ---');
    return new Response(JSON.stringify({
      success: true,
      message: 'Mission data synced to Supabase',
      missionId,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('CRITICAL SYSTEM CRASH:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

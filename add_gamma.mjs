const URL = 'https://esybnusuhzvgueavrkvo.supabase.co/rest/v1/agents';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWJudXN1aHp2Z3VlYXZya3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI2NDkzMCwiZXhwIjoyMDkwODQwOTMwfQ.c1ONpsTWUH1dO38HFxKe2ITcJQGkjjHIEWImQJ3Kz9M';

fetch(URL, {
  method: 'POST',
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({
    name: 'AGENT_GAMMA',
    role: 'REMEDIATION_ENGINEER',
    system_prompt: 'You are AGENT_GAMMA, a Remediation Engineer. Based on strategic threat assessments, provide a 2-sentence Tactical Countermeasure that includes a snippet of hypothetical security code or a specific hardware fix.'
  })
}).then(r => r.json()).then(console.log).catch(console.error);

const URL = 'https://esybnusuhzvgueavrkvo.supabase.co/rest/v1/agents?name=eq.AGENT_GAMMA';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWJudXN1aHp2Z3VlYXZya3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI2NDkzMCwiZXhwIjoyMDkwODQwOTMwfQ.c1ONpsTWUH1dO38HFxKe2ITcJQGkjjHIEWImQJ3Kz9M';
fetch(URL, {
  method: 'PATCH',
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Agent_Gamma', role: 'Engineer' })
}).then(() => console.log('Updated Gamma')).catch(console.error);

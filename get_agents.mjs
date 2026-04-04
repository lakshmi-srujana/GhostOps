const URL = 'https://esybnusuhzvgueavrkvo.supabase.co/rest/v1/agents?select=*';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWJudXN1aHp2Z3VlYXZya3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI2NDkzMCwiZXhwIjoyMDkwODQwOTMwfQ.c1ONpsTWUH1dO38HFxKe2ITcJQGkjjHIEWImQJ3Kz9M';
fetch(URL, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }).then(r => r.json()).then(console.log);

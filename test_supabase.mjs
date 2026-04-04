import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Manual .env.local parsing
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').filter(line => line && !line.startsWith('#')).forEach(line => {
  const [key, ...value] = line.split('=')
  env[key.trim()] = value.join('=').trim()
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables in .env.local')
  console.log('Available keys:', Object.keys(env))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  console.log('--- SUPABASE DIAGNOSTIC ---')
  console.log('URL:', supabaseUrl)
  
  try {
    console.log('Attempting fetch from "missions" table...')
    const { data, error } = await supabase.from('missions').select('*').limit(1)
    
    if (error) {
      console.error('❌ Supabase error:', error.message)
      console.error('Error Code:', error.code)
      console.error('Full Error Detail:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Success! Data returned:', data)
    }

    console.log('\nChecking "mission_logs" table...')
    const { data: logData, error: logError } = await supabase.from('mission_logs').select('*').limit(1)
    if (logError) {
      console.error('❌ Mission logs error:', logError.message)
    } else {
      console.log('✅ Mission logs accessible.')
    }
    
  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err.message)
  }
}

testConnection()

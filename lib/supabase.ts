import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 1. Standard Client (Safe for Browser & Server)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Admin Client (ONLY works on the Server/API)
// We add a check: only create this if the secret key actually exists
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
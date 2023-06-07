import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://fznduynqiocrrwbylofe.supabase.co'
export const initializeSupabase = ({ supabaseKey }: { supabaseKey: string }) =>
  createClient(supabaseUrl, supabaseKey)

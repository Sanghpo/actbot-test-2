import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging for Supabase configuration
console.log('🔧 Supabase Client Configuration:')
console.log('VITE_SUPABASE_URL:', supabaseUrl)
console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)
console.log('VITE_SUPABASE_ANON_KEY length:', supabaseAnonKey?.length || 0)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:')
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl)
  console.error('- VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Validate URL format
try {
  new URL(supabaseUrl)
  console.log('✅ Supabase URL format is valid')
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl)
  throw new Error('Invalid Supabase URL format in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Log the constructed Edge Function base URL
console.log('🔗 Edge Function base URL will be:', `${supabaseUrl}/functions/v1/`)
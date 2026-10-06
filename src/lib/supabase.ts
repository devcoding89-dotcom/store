import { createClient, type User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types/marketplace'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Account sign-in is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
  }

  return supabase
}

export function toAppUser(user: SupabaseUser): User {
  const metadata = user.user_metadata

  return {
    id: user.id,
    name: typeof metadata.name === 'string' ? metadata.name : user.email ?? 'Customer',
    email: user.email ?? '',
    phone: typeof metadata.phone === 'string' ? metadata.phone : '',
    address: typeof metadata.address === 'string' ? metadata.address : '',
    role: 'customer',
  }
}

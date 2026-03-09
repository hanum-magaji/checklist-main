import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sxhowoythcilbtjphezt.supabase.co'
const supabaseAnonKey = 'sb_publishable_Su7FdTAm6kkP4T3RzpLk_g_FuPxv5WS'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
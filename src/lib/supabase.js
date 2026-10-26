import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

function readInitialAuthRedirect() {
  if (typeof window === 'undefined') return { type: '', errorDescription: '' }

  const url = new URL(window.location.href)
  const hashParameters = new URLSearchParams(url.hash.replace(/^#/, ''))

  return {
    type: url.searchParams.get('type') || hashParameters.get('type') || '',
    errorDescription: url.searchParams.get('error_description') || hashParameters.get('error_description') || '',
  }
}

// Supabase removes its auth tokens from the URL while the client initializes.
// Capture the link type first so the UI still knows an invitation was opened.
export const initialAuthRedirect = readInitialAuthRedirect()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const DOCUMENT_BUCKET = 'county-documents'

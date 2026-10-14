import type { Session } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

// Who is signed in on this phone. Undefined while the stored session is still being read.
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])
  return session
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return error ? "That email and password do not match an account." : null
}

export const signOut = () => supabase.auth.signOut()

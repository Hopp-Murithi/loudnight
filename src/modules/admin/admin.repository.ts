import "server-only"
import { ADMIN_PAGE_SIZE } from "@/config/admin"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

// Search text goes inside a PostgREST filter, so only letters, digits, spaces and a few marks are kept.
export const searchTerm = (q: string | undefined) => (q ?? "").replace(/[^\p{L}\p{N} .@'-]/gu, "").trim()

const window = (page: number) => [(page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE] as const

type Counted = PromiseLike<{ count: number | null; error: { code?: string; message: string } | null }>
const total = async (query: Counted) => {
  const { count, error } = await query
  check(error)
  return count ?? 0
}

// Every read goes through the administrator's own session: RLS gives administrators every venue and person.
export const adminRepository = {
  async venues(supabase: ServerSupabase, q: string, page: number) {
    const [from, to] = window(page)
    const query = supabase
      .from("venues")
      .select("id, name, city, country_code, address, venue_type, is_demo, created_at, suspended_at, suspended_reason")
    const { data, error } = await (q ? query.or(`name.ilike.%${q}%,city.ilike.%${q}%`) : query)
      .order("created_at", { ascending: false })
      .range(from, to)
    check(error)
    return data ?? []
  },

  async people(supabase: ServerSupabase, q: string, page: number) {
    const [from, to] = window(page)
    const query = supabase.from("profiles").select("id, display_name, email, role, is_anonymous, is_active, created_at")
    const { data, error } = await (q ? query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`) : query)
      .order("created_at", { ascending: false })
      .range(from, to)
    check(error)
    return data ?? []
  },

  async counts(supabase: ServerSupabase, since: string) {
    const [venues, suspended, people, withEmail, plans, failed, published, rsvps, checkins] = await Promise.all([
      total(supabase.from("venues").select("id", { count: "exact", head: true })),
      total(supabase.from("venues").select("id", { count: "exact", head: true }).not("suspended_at", "is", null)),
      total(supabase.from("profiles").select("id", { count: "exact", head: true })),
      total(supabase.from("profiles").select("id", { count: "exact", head: true }).not("email", "is", null)),
      total(
        supabase
          .from("agent_runs")
          .select("id", { count: "exact", head: true })
          .eq("mode", "encore")
          .gte("created_at", since),
      ),
      total(
        supabase
          .from("agent_runs")
          .select("id", { count: "exact", head: true })
          .eq("mode", "encore")
          .eq("status", "failed")
          .gte("created_at", since),
      ),
      total(supabase.from("event_nights").select("id", { count: "exact", head: true }).eq("status", "published")),
      total(supabase.from("rsvps").select("id", { count: "exact", head: true }).gte("created_at", since)),
      total(supabase.from("checkins").select("id", { count: "exact", head: true }).gte("created_at", since)),
    ])
    return { venues, suspended, people, withEmail, plans, failed, published, rsvps, checkins }
  },

  // Through the session: the database lets only administrators touch these columns, and audits the change.
  async setSuspension(supabase: ServerSupabase, venueId: string, reason: string | null): Promise<boolean> {
    const { data, error } = await supabase
      .from("venues")
      .update({ suspended_at: reason ? new Date().toISOString() : null, suspended_reason: reason })
      .eq("id", venueId)
      .select("id")
    check(error)
    return (data ?? []).length > 0
  },

  async findPerson(supabase: ServerSupabase, personId: string) {
    const { data, error } = await supabase.from("profiles").select("id, role").eq("id", personId).maybeSingle()
    check(error)
    return data
  },

  // A person's status is changed with the service role, which the rules allow for profiles' role and status.
  async setActive(admin: AdminSupabase, personId: string, active: boolean): Promise<void> {
    const { error } = await admin.from("profiles").update({ is_active: active }).eq("id", personId)
    check(error)
  },
}

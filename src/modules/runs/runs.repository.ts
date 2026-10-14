import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Database, Enums } from "@/types/database"

type StepInsert = Database["public"]["Tables"]["run_steps"]["Insert"]
type StepUpdate = Database["public"]["Tables"]["run_steps"]["Update"]
type RunUpdate = Database["public"]["Tables"]["agent_runs"]["Update"]

const RUN_COLUMNS = "id, venue_id, mode, target_weekday, status, current_step, error_message, context, created_at"
const STEP_COLUMNS = "id, step, tool, status, input, output_summary, qloo_cache_id, latency_ms, started_at"

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

export const runsRepository = {
  // Started with the caller's session: RLS allows owners and managers, and the database caps runs per hour.
  async createPair(
    supabase: ServerSupabase | AdminSupabase,
    venueId: string,
    userId: string | null,
    weekday: Enums<"weekday">,
  ) {
    const encore = await supabase
      .from("agent_runs")
      .insert({ venue_id: venueId, requested_by: userId, mode: "encore", target_weekday: weekday })
      .select("id")
      .single()
    check(encore.error)
    const encoreId = encore.data?.id ?? ""
    const generic = await supabase
      .from("agent_runs")
      .insert({ venue_id: venueId, mode: "generic", target_weekday: weekday, pair_id: encoreId })
      .select("id")
      .single()
    check(generic.error)
    return { encoreId, genericId: generic.data?.id ?? "" }
  },

  async findRun(supabase: ServerSupabase | AdminSupabase, runId: string) {
    const { data, error } = await supabase.from("agent_runs").select(RUN_COLUMNS).eq("id", runId).maybeSingle()
    check(error)
    return data
  },

  async findGeneric(supabase: ServerSupabase, encoreId: string) {
    const { data, error } = await supabase
      .from("agent_runs")
      .select("id, generic_answer")
      .eq("pair_id", encoreId)
      .maybeSingle()
    check(error)
    return data
  },

  async latestRun(supabase: ServerSupabase, venueId: string, weekday?: Enums<"weekday">) {
    const query = supabase.from("agent_runs").select("id").eq("venue_id", venueId).eq("mode", "encore")
    const { data, error } = await (weekday ? query.eq("target_weekday", weekday) : query)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    check(error)
    return data
  },

  async latestRunsFor(supabase: ServerSupabase, venueIds: string[], weekday?: Enums<"weekday">) {
    if (venueIds.length === 0) return []
    const query = supabase
      .from("agent_runs")
      .select("id, venue_id, status, created_at")
      .in("venue_id", venueIds)
      .eq("mode", "encore")
    const { data, error } = await (weekday ? query.eq("target_weekday", weekday) : query)
      .order("created_at", { ascending: false })
      .limit(100)
    check(error)
    return data ?? []
  },

  async shortlistsFor(supabase: ServerSupabase, runIds: string[]) {
    if (runIds.length === 0) return []
    const { data, error } = await supabase
      .from("concepts")
      .select("id, run_id, name, rank, total_score, chosen_at")
      .in("run_id", runIds)
      .eq("is_shortlisted", true)
      .order("rank")
      .limit(60)
    check(error)
    return data ?? []
  },

  async listSteps(supabase: ServerSupabase | AdminSupabase, runId: string) {
    const { data, error } = await supabase
      .from("run_steps")
      .select(STEP_COLUMNS)
      .eq("run_id", runId)
      .order("started_at")
      .limit(200)
    check(error)
    return data ?? []
  },

  async findStep(supabase: ServerSupabase, stepId: string) {
    const { data, error } = await supabase
      .from("run_steps")
      .select("id, tool, input, output_summary, qloo_cache_id")
      .eq("id", stepId)
      .maybeSingle()
    check(error)
    return data
  },

  // Takes a step atomically, so a double click or a second tab cannot run it twice. A failed step can be taken again.
  async claimStep(admin: AdminSupabase, runId: string, step: Enums<"pipeline_step">, first: boolean): Promise<boolean> {
    const now = new Date().toISOString()
    const { data, error } = await admin
      .from("agent_runs")
      .update({
        status: "running",
        current_step: step,
        error_message: null,
        finished_at: null,
        ...(first ? { started_at: now } : {}),
      })
      .eq("id", runId)
      .or(`current_step.is.null,current_step.neq.${step},status.eq.failed`)
      .select("id")
    check(error)
    return (data ?? []).length > 0
  },

  async recentRunTimes(supabase: ServerSupabase, userId: string, since: string) {
    const { data, error } = await supabase
      .from("agent_runs")
      .select("created_at")
      .eq("requested_by", userId)
      .gte("created_at", since)
      .order("created_at")
      .limit(10)
    check(error)
    return (data ?? []).map((row) => row.created_at)
  },

  // Run status and context are agent output, written by the service role.
  async updateRun(admin: AdminSupabase, runId: string, update: RunUpdate): Promise<void> {
    check((await admin.from("agent_runs").update(update).eq("id", runId)).error)
  },

  async insertStep(admin: AdminSupabase, step: StepInsert): Promise<string> {
    const { data, error } = await admin.from("run_steps").insert(step).select("id").single()
    check(error)
    return data?.id ?? ""
  },

  async finishStep(admin: AdminSupabase, id: string, update: StepUpdate): Promise<void> {
    check((await admin.from("run_steps").update(update).eq("id", id)).error)
  },
}

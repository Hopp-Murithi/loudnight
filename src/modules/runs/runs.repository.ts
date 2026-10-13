import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { Database } from "@/types/database"

type StepInsert = Database["public"]["Tables"]["run_steps"]["Insert"]
type StepUpdate = Database["public"]["Tables"]["run_steps"]["Update"]

// Agent output is written by the service role; sessions only ever read it through RLS.
export const runsRepository = {
  async insertStep(admin: AdminSupabase, step: StepInsert): Promise<string> {
    const { data, error } = await admin.from("run_steps").insert(step).select("id").single()
    if (error) throw fromDatabaseError(error)
    return data.id
  },

  async finishStep(admin: AdminSupabase, id: string, update: StepUpdate): Promise<void> {
    const { error } = await admin.from("run_steps").update(update).eq("id", id)
    if (error) throw fromDatabaseError(error)
  },
}

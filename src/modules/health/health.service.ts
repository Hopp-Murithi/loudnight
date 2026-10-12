import "server-only"
import { AppError } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import { healthRepository } from "./health.repository"

export const healthService = {
  // For uptime checks. Says only whether the app and its database answer, never which keys are set.
  async check(supabase: ServerSupabase) {
    if (!(await healthRepository.databaseAnswers(supabase))) {
      throw new AppError("upstream_failed", "The database did not answer.")
    }
    return { status: "ok" as const }
  },
}

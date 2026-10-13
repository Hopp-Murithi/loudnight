import "server-only"
import { AppError, rateLimited } from "@/lib/http/errors"
import { formatNightTime } from "@/lib/format"
import type { RequestContext } from "@/modules/auth/types"
import { runsRepository } from "./runs.repository"

const HOUR_MS = 3_600_000

// The database caps fresh plans per person per hour. The message says when the next one opens, in venue time.
export async function startMessage(ctx: RequestContext, error: unknown, timeZone: string): Promise<unknown> {
  if (!(error instanceof AppError) || error.code !== "rate_limited") return error
  const since = new Date(Date.now() - HOUR_MS).toISOString()
  const [oldest] = await runsRepository.recentRunTimes(ctx.supabase, ctx.user.id, since)
  if (!oldest) return error
  const opens = new Date(new Date(oldest).getTime() + HOUR_MS).toISOString()
  return rateLimited(`You have planned six times this hour. Try again at ${formatNightTime(opens, timeZone)}.`)
}

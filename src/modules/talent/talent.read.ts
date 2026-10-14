import "server-only"
import type { TalentSource } from "@/config/series"
import { notFound } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import { receiptAt } from "@/modules/concepts/concepts.read"
import type { ReceiptView } from "@/modules/concepts/concepts.schemas"
import type { TalentView } from "@/modules/series/series.schemas"
import { readProfile } from "./talent.profile"
import { reachOf } from "./talent.reach"
import { talentRepository } from "./talent.repository"

const SOURCE_ORDER: TalentSource[] = ["both", "area", "night"]

const sourceOf = (value: string): TalentSource => SOURCE_ORDER.find((source) => source === value) ?? "night"

// The shortlist as the caller may see it. National names come back apart, as styles to look for.
export async function readTalent(
  supabase: ServerSupabase | AdminSupabase,
  conceptId: string,
  budget?: { cents: number; currency: string },
): Promise<{ talent: TalentView[]; references: TalentView[] }> {
  const views = (await talentRepository.listForConcept(supabase, conceptId)).map((row): TalentView => ({
    id: row.id,
    name: row.name,
    tier: row.popularity_tier,
    overlap: Number(row.overlap_score),
    fitSignals: row.fit_signals,
    message: row.outreach_edited ?? row.outreach_draft,
    edited: row.outreach_edited !== null,
    hasReceipt: row.qloo_cache_id !== null,
    booked: row.booked_at !== null,
    bookedAt: row.booked_at,
    source: sourceOf(row.source),
    reach: null,
    profile: readProfile(row.profile),
  }))
  if (budget) for (const view of views) view.reach = reachOf(view.profile, budget.cents, budget.currency)
  // Booked acts first, then local before the rest, then the closest match.
  const ordered = views.sort(
    (a, b) =>
      Number(b.booked) - Number(a.booked) ||
      SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source) ||
      b.overlap - a.overlap,
  )
  return {
    talent: ordered.filter((view) => view.tier !== "national"),
    references: ordered.filter((view) => view.tier === "national"),
  }
}

export async function readTalentReceipt(supabase: ServerSupabase, talentId: string): Promise<ReceiptView> {
  const act = await talentRepository.findForReceipt(supabase, talentId)
  if (!act?.qloo_cache_id || act.response_path.length === 0) throw notFound("That receipt is not available.")
  const tastes = act.fit_signals.join(", ")
  const claim =
    act.source === "area"
      ? `People near your venue follow ${act.name} more than most places do`
      : tastes
        ? `Fans of ${tastes} near you also follow ${act.name}`
        : `${act.name} fits this crowd`
  return receiptAt(act.qloo_cache_id, act.response_path, claim, Number(act.overlap_score))
}

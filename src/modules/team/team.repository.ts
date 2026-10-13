import "server-only"
import type { VenueRole } from "@/config/navigation"
import { fromDatabaseError, unwrap } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"

export const teamRepository = {
  async list(supabase: ServerSupabase, venueId: string) {
    return unwrap(
      await supabase
        .from("venue_members")
        .select("user_id, role, profile:profiles!venue_members_user_id_fkey(display_name, email)")
        .eq("venue_id", venueId)
        .order("created_at")
        .limit(100),
    )
  },

  async add(supabase: ServerSupabase, venueId: string, userId: string, role: VenueRole, addedBy: string) {
    const { error } = await supabase
      .from("venue_members")
      .insert({ venue_id: venueId, user_id: userId, role, added_by: addedBy })
    if (error) throw fromDatabaseError(error)
  },

  async changeRole(supabase: ServerSupabase, venueId: string, userId: string, role: VenueRole): Promise<boolean> {
    const result = await supabase
      .from("venue_members")
      .update({ role })
      .eq("venue_id", venueId)
      .eq("user_id", userId)
      .select("user_id")
    if (result.error) throw fromDatabaseError(result.error)
    return (result.data?.length ?? 0) > 0
  },

  async remove(supabase: ServerSupabase, venueId: string, userId: string): Promise<boolean> {
    const result = await supabase
      .from("venue_members")
      .delete()
      .eq("venue_id", venueId)
      .eq("user_id", userId)
      .select("user_id")
    if (result.error) throw fromDatabaseError(result.error)
    return (result.data?.length ?? 0) > 0
  },
}

import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

// Open data answers shared by every venue. Server only: the table grants nothing to sessions.
export const openDataRepository = {
  async find(admin: AdminSupabase, requestHash: string) {
    const { data, error } = await admin
      .from("open_data_cache")
      .select("response, expires_at")
      .eq("request_hash", requestHash)
      .maybeSingle()
    check(error)
    return data
  },

  async store(
    admin: AdminSupabase,
    row: { source: string; requestHash: string; request: Json; response: Json; expiresAt: string },
  ): Promise<void> {
    const { error } = await admin.from("open_data_cache").upsert(
      {
        source: row.source,
        request_hash: row.requestHash,
        request: row.request,
        response: row.response,
        fetched_at: new Date().toISOString(),
        expires_at: row.expiresAt,
      },
      { onConflict: "request_hash" },
    )
    check(error)
  },
}

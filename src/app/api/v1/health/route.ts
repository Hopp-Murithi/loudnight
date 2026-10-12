import { publicApiRoute } from "@/lib/http/route"
import { healthService } from "@/modules/health/health.service"

// Public so an uptime monitor can call it; it returns no data.
export const GET = publicApiRoute({}, async ({ supabase }) => healthService.check(supabase))

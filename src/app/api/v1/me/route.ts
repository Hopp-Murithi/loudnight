import { apiRoute } from "@/lib/http/route"

export const GET = apiRoute({}, async ({ ctx }) => ctx.user)

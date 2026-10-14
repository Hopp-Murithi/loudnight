import { apiRoute } from "@/lib/http/route"
import { doorService } from "@/modules/door/door.service"

// The whole team reads the door for a night; RLS shows door staff names and arrivals, never contacts or money.
export const GET = apiRoute<undefined, { id: string }>({}, ({ ctx, params }) => doorService.readNight(ctx, params.id))

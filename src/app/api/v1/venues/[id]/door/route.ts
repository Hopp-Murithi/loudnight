import { apiRoute } from "@/lib/http/route"
import { readDoor } from "@/modules/door/door.service"

// The whole team, door staff included: the venue's current night at the door, or null when none is on.
export const GET = apiRoute<undefined, { id: string }>({}, ({ ctx, params }) => readDoor(ctx, params.id))

import "server-only"
import { z } from "zod"
import { QLOO } from "@/config/integrations"

const schemas = {
  service: z.object({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) }),
  ai: z.object({ ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-") }),
  qloo: z.object({
    QLOO_API_KEY: z.string().min(1),
    QLOO_API_URL: z.preprocess((value) => (value === "" ? undefined : value), z.url().default(QLOO.defaultUrl)),
  }),
  places: z.object({ GOOGLE_PLACES_API_KEY: z.string().min(1) }),
  ticketmaster: z.object({ TICKETMASTER_API_KEY: z.string().min(1) }),
  email: z.object({ RESEND_API_KEY: z.string().startsWith("re_"), EMAIL_FROM: z.string().min(3) }),
  preview: z.object({ PREVIEW_COOKIE_SECRET: z.string().min(32) }),
}

type Concern = keyof typeof schemas
type EnvOf<C extends Concern> = z.infer<(typeof schemas)[C]>

const cache = new Map<Concern, unknown>()

// One schema per concern, parsed on first use: a missing Ticketmaster key can never fail a database write.
function read<C extends Concern>(concern: C): EnvOf<C> {
  if (!cache.has(concern)) cache.set(concern, schemas[concern].parse(process.env))
  return cache.get(concern) as EnvOf<C>
}

export const serviceEnv = () => read("service")
export const aiEnv = () => read("ai")
export const qlooEnv = () => read("qloo")
export const placesEnv = () => read("places")
export const ticketmasterEnv = () => read("ticketmaster")
export const emailEnv = () => read("email")
export const previewEnv = () => read("preview")

// Lets a caller report "not set up" instead of throwing.
export function isConfigured(concern: Concern): boolean {
  return schemas[concern].safeParse(process.env).success
}

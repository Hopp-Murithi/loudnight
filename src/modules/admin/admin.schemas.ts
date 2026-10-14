import { z } from "zod"

export const suspendVenueSchema = z.object({
  reason: z.string().trim().min(3, "Say why, in a few words.").max(300, "Keep it under 300 characters."),
})

export const personStatusSchema = z.object({ active: z.boolean() })

export const adminListSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
})

export type SuspendVenueInput = z.infer<typeof suspendVenueSchema>
export type PersonStatusInput = z.infer<typeof personStatusSchema>
export type AdminListQuery = z.infer<typeof adminListSchema>

export interface AdminVenue {
  id: string
  name: string
  place: string
  venueType: string
  isDemo: boolean
  createdAt: string
  suspendedAt: string | null
  suspendedReason: string | null
}

export interface AdminPerson {
  id: string
  name: string
  email: string | null
  role: string
  isAnonymous: boolean
  isActive: boolean
  createdAt: string
}

export interface AdminOverview {
  venues: number
  suspendedVenues: number
  people: number
  peopleWithEmail: number
  plansToday: number
  failedPlansToday: number
  publishedNights: number
  rsvpsToday: number
  checkinsToday: number
}

export interface AdminPage<T> {
  rows: T[]
  page: number
  hasMore: boolean
}

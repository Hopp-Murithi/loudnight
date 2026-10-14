import { ROUTES } from "./site"

// The console's lists show this many rows a page; every query is bounded by it.
export const ADMIN_PAGE_SIZE = 25

export const ADMIN_SECTIONS = [
  { label: "Overview", href: ROUTES.admin },
  { label: "Venues", href: ROUTES.adminVenues },
  { label: "People", href: ROUTES.adminPeople },
  { label: "Audit log", href: ROUTES.adminAudit },
] as const

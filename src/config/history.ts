// How each audited change reads on the History page. Unknown actions fall back to a plain "changed".
export const HISTORY_ACTIONS: Record<string, string> = {
  "venues.insert": "added the venue",
  "venues.update": "changed the venue details",
  "venue_settings.insert": "set up the nights",
  "venue_settings.update": "changed the settings",
  "venue_members.insert": "added someone to the team",
  "venue_members.update": "changed someone's role",
  "venue_members.delete": "removed someone from the team",
  "concepts.update": "chose a night",
  "series.insert": "started a series",
  "series.update": "changed a series",
  "event_nights.insert": "added an event night",
  "event_nights.update": "changed an event night",
  "talent_candidates.update": "reworded a message to a performer",
}

// Column names in the change list, said the way an owner would.
export const HISTORY_FIELDS: Record<string, string> = {
  slow_night: "quiet night",
  break_even_headcount: "break-even",
  capacity: "room size",
  capabilities: "what the space hosts",
  talent_budget_cents: "talent budget",
  average_spend_cents: "guest spend",
  search_radius_m: "search radius",
  name: "name",
  address: "address",
  time_zone: "time zone",
  role: "role",
  chosen_at: "chosen night",
  starts_at: "date and time",
  variation: "the week's twist",
  outreach_edited: "message",
}

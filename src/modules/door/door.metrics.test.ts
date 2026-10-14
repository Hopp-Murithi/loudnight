import { describe, expect, it } from "vitest"
import { monthlyGain, nightNumbers, paysFor } from "./door.metrics"

describe("nightNumbers", () => {
  const guests = [
    { id: "a", partySize: 2 },
    { id: "b", partySize: 1 },
    { id: "c", partySize: 4 },
    { id: "d", partySize: 1 },
  ]

  it("counts places saved, people through the door, walk-ins and the show-up rate", () => {
    const numbers = nightNumbers({
      guests,
      arrivals: [
        { rsvpId: "a", partySize: 2 },
        { rsvpId: "c", partySize: 3 },
        { rsvpId: null, partySize: 2 },
      ],
      breakEven: 40,
      averageSpendCents: 2000,
      loggedSpendCents: null,
    })
    expect(numbers).toEqual({
      rsvps: 4,
      rsvpPeople: 8,
      arrived: 7,
      walkIns: 2,
      showUpRate: 0.5,
      toBreakEven: 33,
      takingsCents: 14000,
      takingsLogged: false,
    })
  })

  it("uses the owner's logged takings over the estimate, and stops at zero once break-even is passed", () => {
    const numbers = nightNumbers({
      guests: [],
      arrivals: [{ rsvpId: null, partySize: 10 }],
      breakEven: 8,
      averageSpendCents: 2000,
      loggedSpendCents: 31500,
    })
    expect(numbers).toMatchObject({ toBreakEven: 0, takingsCents: 31500, takingsLogged: true, showUpRate: null })
  })
})

describe("the monthly sum", () => {
  it("matches the brief: 30 extra guests at $20 each, four weeks, is $2,400", () => {
    expect(monthlyGain(30, 2000)).toBe(240000)
  })

  it("says how many times that pays for Encore, and never goes below nothing", () => {
    expect(paysFor(240000, 4900)).toBe(48)
    expect(paysFor(240000, 0)).toBe(0)
    expect(monthlyGain(-3, 2000)).toBe(0)
  })
})

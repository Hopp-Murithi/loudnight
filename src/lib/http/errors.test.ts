import { describe, expect, it } from "vitest"
import { AppError, fromDatabaseError, unwrap } from "./errors"

describe("fromDatabaseError", () => {
  it.each([
    ["42501", "forbidden", 403],
    ["23505", "conflict", 409],
    ["23514", "validation_failed", 422],
    ["PGRST116", "not_found", 404],
    ["EA429", "rate_limited", 429],
  ])("maps %s to %s", (code, expected, status) => {
    const error = fromDatabaseError({ code })
    expect(error.code).toBe(expected)
    expect(error.status).toBe(status)
  })

  it("never repeats the database's own message", () => {
    const error = fromDatabaseError({ code: "XX000", message: 'relation "secret_table" does not exist' })
    expect(error.code).toBe("internal")
    expect(error.message).not.toMatch(/secret_table/)
  })

  it("names the evidence receipt failure as a validation error, not a crash", () => {
    expect(fromDatabaseError({ code: "23514", message: "evidence value has no receipt" }).status).toBe(422)
  })
})

describe("unwrap", () => {
  it("returns data when there is no error", () => {
    expect(unwrap({ data: [1, 2], error: null })).toEqual([1, 2])
  })

  it("throws a typed error when the query failed", () => {
    expect(() => unwrap({ data: null, error: { code: "42501" } })).toThrow(AppError)
  })
})

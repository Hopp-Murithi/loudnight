export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "email_not_verified"
  | "not_found"
  | "validation_failed"
  | "conflict"
  | "rate_limited"
  | "upstream_failed"
  | "internal"

const STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  email_not_verified: 403,
  not_found: 404,
  validation_failed: 422,
  conflict: 409,
  rate_limited: 429,
  upstream_failed: 502,
  internal: 500,
}

export class AppError extends Error {
  readonly status: number

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = "AppError"
    this.status = STATUS[code]
  }
}

export const unauthorized = (message = "Start a session to continue.") => new AppError("unauthorized", message)
export const forbidden = (message = "You do not have access to this.") => new AppError("forbidden", message)
export const notFound = (message = "Not found.") => new AppError("not_found", message)
export const conflict = (message: string) => new AppError("conflict", message)
export const rateLimited = (message = "You have done this too often. Wait a few minutes and try again.") =>
  new AppError("rate_limited", message)
export const upstreamFailed = (service: string) =>
  new AppError("upstream_failed", `${service} did not answer. Try again in a moment.`)
export const validationFailed = (details: unknown) =>
  new AppError("validation_failed", "Some fields are invalid.", details)

interface PostgresErrorLike {
  code?: string
  message?: string
}

// Translates database errors into the errors clients should see. The database's own text never leaves the server.
export function fromDatabaseError(error: PostgresErrorLike): AppError {
  switch (error.code) {
    case "42501":
      return forbidden()
    case "23505":
      return conflict("That record already exists.")
    case "23503":
      return conflict("That record is linked to other data.")
    case "23514":
    case "22P02":
      return new AppError("validation_failed", "Some fields are invalid.")
    case "P0002":
    case "PGRST116":
      return notFound()
    case "EA429":
      return rateLimited()
    case "EA410":
      return conflict("Check-in is open only on the night.")
    case "PGRST205":
      return new AppError("internal", "A required database update is not installed.")
    default:
      return new AppError("internal", "Something went wrong. Try again.")
  }
}

// Unwraps a Supabase result, throwing a typed error when it failed.
export function unwrap<T>(result: { data: T | null; error: PostgresErrorLike | null }): T {
  if (result.error) throw fromDatabaseError(result.error)
  return result.data as T
}

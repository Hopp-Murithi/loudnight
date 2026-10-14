import "server-only"
import { NextResponse, type NextRequest } from "next/server"
import type { ZodType } from "zod"
import type { RateLimitRule } from "@/config/limits"
import type { AppRole } from "@/config/roles"
import { createServerSupabase, type ServerSupabase } from "@/lib/supabase/server"
import { getApiContext } from "@/modules/auth/server/context"
import type { RequestContext } from "@/modules/auth/types"
import { AppError, forbidden, validationFailed } from "./errors"
import { enforceRateLimit } from "./rate-limit"
import { NDJSON } from "./stream"

interface HandlerArgs<TBody, TParams> {
  ctx: RequestContext
  body: TBody
  params: TParams
  request: NextRequest
}

interface PublicHandlerArgs<TBody, TParams> {
  supabase: ServerSupabase
  body: TBody
  params: TParams
  request: NextRequest
}

interface RouteOptions<TBody> {
  roles?: AppRole[]
  // Only the route that ends a preview may write while one is active.
  ignorePreview?: boolean
  body?: ZodType<TBody>
  rateLimit?: RateLimitRule
}

interface PublicRouteOptions<TBody> {
  body?: ZodType<TBody>
  rateLimit?: RateLimitRule
}

type RouteParams<TParams> = { params: Promise<TParams> }

function errorResponse(error: unknown) {
  const appError = error instanceof AppError ? error : new AppError("internal", "Something went wrong. Try again.")
  if (!(error instanceof AppError)) console.error(error)

  return NextResponse.json(
    { error: { code: appError.code, message: appError.message, details: appError.details } },
    { status: appError.status },
  )
}

async function parseBody<TBody>(request: NextRequest, schema?: ZodType<TBody>): Promise<TBody> {
  if (!schema) return undefined as TBody
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed(parsed.error.flatten().fieldErrors)
  return parsed.data
}

// Nothing is written while an administrator previews someone. The database refuses too; this says why.
function refusePreviewWrites(ctx: RequestContext, request: NextRequest, ignore: boolean | undefined) {
  if (ctx.preview && request.method !== "GET" && !ignore)
    throw forbidden("You are previewing as someone else. Exit preview to make changes.")
}

export function apiRoute<TBody = undefined, TParams = Record<string, never>>(
  options: RouteOptions<TBody>,
  handler: (args: HandlerArgs<TBody, TParams>) => Promise<unknown>,
) {
  return async (request: NextRequest, route: RouteParams<TParams>) => {
    try {
      const ctx = await getApiContext(options.roles)
      refusePreviewWrites(ctx, request, options.ignorePreview)
      if (options.rateLimit) await enforceRateLimit(request.headers, options.rateLimit)
      const body = await parseBody(request, options.body)
      const data = await handler({ ctx, body, params: await route.params, request })
      return NextResponse.json({ data })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

// Same gates as apiRoute; failures before the stream starts still use the JSON envelope.
export function apiStreamRoute<TBody = undefined, TParams = Record<string, never>>(
  options: RouteOptions<TBody>,
  handler: (args: HandlerArgs<TBody, TParams>) => Promise<ReadableStream<Uint8Array>>,
) {
  return async (request: NextRequest, route: RouteParams<TParams>) => {
    try {
      const ctx = await getApiContext(options.roles)
      refusePreviewWrites(ctx, request, options.ignorePreview)
      if (options.rateLimit) await enforceRateLimit(request.headers, options.rateLimit)
      const body = await parseBody(request, options.body)
      const stream = await handler({ ctx, body, params: await route.params, request })
      return new Response(stream, { headers: { "Content-Type": NDJSON, "Cache-Control": "no-store" } })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

// For guests: event pages, RSVPs and door check-ins. The client still acts as the caller, so RLS applies.
export function publicApiRoute<TBody = undefined, TParams = Record<string, never>>(
  options: PublicRouteOptions<TBody>,
  handler: (args: PublicHandlerArgs<TBody, TParams>) => Promise<unknown>,
) {
  return async (request: NextRequest, route: RouteParams<TParams>) => {
    try {
      if (options.rateLimit) await enforceRateLimit(request.headers, options.rateLimit)
      const body = await parseBody(request, options.body)
      const supabase = await createServerSupabase()
      const data = await handler({ supabase, body, params: await route.params, request })
      return NextResponse.json({ data })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export { errorResponse }

// Names Encore never shows on a card, whatever an upstream service returns. Kept narrow to avoid hiding real names.
export const BLOCKED_NAME_PATTERNS: readonly RegExp[] = [
  /n+[i1!]+g{2,}(?:[e3]+r|[a@]+h?|uh)/i,
  /\bf+[a@]+g+(?:[o0]+t+)?s?\b/i,
  /\bch[i1]nks?\b/i,
]

export const isPresentableName = (name: string) => !BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(name))

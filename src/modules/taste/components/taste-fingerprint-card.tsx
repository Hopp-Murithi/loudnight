import { TYPE } from "@/lib/typography"
import type { TasteFingerprint } from "../taste.schemas"
import { AudienceLean } from "./audience-lean"
import { DomainTile } from "./domain-tile"

// The "read the neighbourhood" step made visible: every domain Loudnight read, then who loves the leading tastes.
export function TasteFingerprintCard({ fingerprint }: { fingerprint: TasteFingerprint }) {
  const withResults = fingerprint.domains.filter((domain) => domain.status === "ok").length

  return (
    <section aria-labelledby="fingerprint-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="fingerprint-heading" className={TYPE.h2}>
          The neighbourhood&apos;s taste
        </h2>
        <p className="text-sm text-muted-foreground">
          {withResults} of {fingerprint.domains.length} areas of taste read from Qloo, strongest first. Every answer is
          under Qloo calls.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {fingerprint.domains.map((domain) => (
          <li key={domain.domain} className="min-w-0">
            <DomainTile result={domain} />
          </li>
        ))}
      </ul>
      {fingerprint.audience && <AudienceLean audience={fingerprint.audience} />}
    </section>
  )
}

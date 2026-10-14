import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"

// The bridge from watching to doing: the same plan, for the reader's own room.
export function TryYourOwn({ night }: { night: string }) {
  return (
    <section
      aria-labelledby="try-heading"
      className="dark poster-glow flex flex-col gap-5 p-6 text-foreground sm:p-10 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="space-y-3">
        <h2 id="try-heading" className="font-display text-5xl leading-[0.9] font-extrabold text-balance">
          Now your {night}.
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Add your address and your quiet night. Loudnight runs these same six steps for your neighbourhood in about a
          minute.
        </p>
      </div>
      <Button size="lg" className="self-start lg:self-auto" nativeButton={false} render={<Link href={ROUTES.signup} />}>
        Try it on your own venue
      </Button>
    </section>
  )
}

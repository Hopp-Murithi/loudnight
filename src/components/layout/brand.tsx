import Image from "next/image"
import Link from "next/link"
import { ROUTES, SITE } from "@/config/site"
import { cn } from "@/lib/utils"

interface BrandProps {
  href?: string
  className?: string
  nameClassName?: string
}

// The spotlight mark and the marquee wordmark. Always a way back to where you started.
export function Brand({ href = ROUTES.home, className, nameClassName }: BrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      aria-label={`${SITE.name} home`}
    >
      <Image src="/logo.svg" alt="" width={28} height={28} priority className="size-7 shrink-0" />
      <span className={cn("font-display text-2xl leading-none font-extrabold tracking-tight", nameClassName)}>
        {SITE.name}
      </span>
    </Link>
  )
}

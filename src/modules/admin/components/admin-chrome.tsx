import { Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ADMIN_SECTIONS } from "@/config/admin"
import { cn } from "@/lib/utils"

// The console's sections, as tabs that are plain links.
export function AdminNav({ current }: { current: string }) {
  return (
    <nav aria-label="Console" className="flex flex-wrap gap-1 bg-muted/60 p-1 sm:w-fit">
      {ADMIN_SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          aria-current={section.href === current ? "page" : undefined}
          className={cn(
            "inline-flex min-h-9 flex-1 items-center justify-center px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-none",
            section.href === current && "bg-background text-foreground shadow-sm",
          )}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  )
}

// A plain search form: it reloads the page with ?q=, so the list stays server rendered and bounded.
export function AdminSearch({ label, value }: { label: string; value: string | undefined }) {
  return (
    <form role="search" className="flex max-w-md gap-2">
      <label htmlFor="admin-search" className="sr-only">
        {label}
      </label>
      <Input id="admin-search" name="q" type="search" defaultValue={value} placeholder={label} className="h-9" />
      <Button type="submit" variant="outline" className="h-9">
        <Search aria-hidden className="size-4" />
        Search
      </Button>
    </form>
  )
}

export function AdminPager({ path, q, page, hasMore }: { path: string; q?: string; page: number; hasMore: boolean }) {
  const href = (to: number) => `${path}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(to) })}`
  if (page === 1 && !hasMore) return null
  return (
    <nav aria-label="Pages" className="flex items-center gap-3 text-sm">
      {page > 1 && (
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href(page - 1)} />}>
          Newer
        </Button>
      )}
      <span className="text-muted-foreground">Page {page}</span>
      {hasMore && (
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href(page + 1)} />}>
          Older
        </Button>
      )}
    </nav>
  )
}

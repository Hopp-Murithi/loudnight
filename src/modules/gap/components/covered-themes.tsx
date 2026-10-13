import type { CoveredTheme } from "../gap.schemas"

// What nearby venues already run, busiest first. The count says how many venues or events fit each theme.
export function CoveredThemes({ themes }: { themes: CoveredTheme[] }) {
  const sorted = [...themes].sort((a, b) => b.count - a.count)
  return (
    <ul aria-label="Already covered nearby" className="flex flex-wrap gap-2">
      {sorted.map((theme, index) => (
        <li
          key={`${theme.theme}-${index}`}
          title={theme.examples.length > 0 ? `For example: ${theme.examples.join(", ")}` : undefined}
          className="inline-flex items-center gap-2 border bg-muted/50 py-1 pr-1 pl-2.5 text-sm"
        >
          {theme.theme}
          <span className="min-w-6 bg-background px-1.5 text-center text-xs text-muted-foreground tabular-nums">
            {theme.count}
          </span>
        </li>
      ))}
    </ul>
  )
}

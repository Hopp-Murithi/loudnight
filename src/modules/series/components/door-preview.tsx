// What the door screen shows on the night: one big count against break-even. Here at zero, before the first night.
export function DoorPreview({ breakEven }: { breakEven: number | null }) {
  return (
    <div className="dark border border-white/10 bg-background p-6 text-foreground" aria-label="Door screen preview">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>The door, on the night</span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full bg-muted-foreground" />
          Not open yet
        </span>
      </div>
      <p className="mt-6 flex items-baseline gap-3">
        <span className="font-display text-7xl leading-none font-extrabold tabular-nums">0</span>
        <span className="text-muted-foreground">checked in</span>
      </p>
      <div aria-hidden className="relative mt-5 h-2 bg-muted">
        <span className="absolute -top-1.5 left-2/3 h-5 w-0.5 bg-foreground" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {breakEven ? `${breakEven} to break even` : "The count fills as guests arrive"}
      </p>
    </div>
  )
}

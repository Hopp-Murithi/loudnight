export type Tone = "success" | "info" | "warning" | "danger" | "neutral"

interface ToneClasses {
  soft: string
  dot: string
  text: string
  border: string
}

// Static strings so Tailwind can see every class.
export const TONE: Record<Tone, ToneClasses> = {
  success: { soft: "bg-success/12 text-success", dot: "bg-success", text: "text-success", border: "border-success/40" },
  info: { soft: "bg-info/12 text-info", dot: "bg-info", text: "text-info", border: "border-info/40" },
  warning: { soft: "bg-warning/14 text-warning", dot: "bg-warning", text: "text-warning", border: "border-warning/40" },
  danger: {
    soft: "bg-destructive/12 text-destructive",
    dot: "bg-destructive",
    text: "text-destructive",
    border: "border-destructive/40",
  },
  neutral: {
    soft: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    border: "border-border",
  },
}

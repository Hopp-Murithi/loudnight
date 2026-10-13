import { MessageSquareText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface GenericAnswerProps {
  answer: string | undefined
  loading: boolean
  failed: boolean
}

// What a plain chatbot says about the same venue and night, with no local data. It is the contrast, so it stays quiet.
export function GenericAnswer({ answer, loading, failed }: GenericAnswerProps) {
  return (
    <article aria-labelledby="generic-heading" className="space-y-4 border border-dashed bg-muted/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="generic-heading" className="flex items-center gap-2 font-semibold text-muted-foreground">
          <MessageSquareText aria-hidden className="size-4" />A general chatbot
        </h3>
        <span className="border px-2 py-0.5 text-xs text-muted-foreground">No local data used</span>
      </div>
      {loading && (
        <div className="space-y-2" role="status" aria-label="Asking a general chatbot">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
      {failed && <p className="text-sm text-muted-foreground">The general chatbot did not answer this time.</p>}
      {answer && <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{answer}</p>}
    </article>
  )
}

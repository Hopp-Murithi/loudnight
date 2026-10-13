"use client"

import { DetailSheet } from "@/components/shared/detail-sheet"
import { ErrorState } from "@/components/shared/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { formatAffinity } from "../concepts.grounding"
import type { ReceiptView } from "../concepts.schemas"
import { useReceipt, type ReceiptSource } from "../hooks/use-receipt"
import { ReceiptBody } from "./receipt-body"

const describe = (receipt: ReceiptView) =>
  receipt.value === null ? receipt.claim : `${receipt.claim}: ${formatAffinity(receipt.value)}`

// Where a number comes from: the exact Qloo question, and the part of the answer that holds it.
export function ReceiptSheet({ source, onClose }: { source: ReceiptSource | null; onClose: () => void }) {
  const receipt = useReceipt(source)

  return (
    <DetailSheet
      open={source !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Where this number comes from"
      description={receipt.data ? describe(receipt.data) : undefined}
    >
      {receipt.isPending && (
        <div className="space-y-3" role="status" aria-label="Loading the receipt">
          <Skeleton className="h-16" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      )}
      {receipt.isError && (
        <ErrorState
          title="The receipt did not load"
          description="Try again in a moment."
          onRetry={() => receipt.refetch()}
        />
      )}
      {receipt.data && <ReceiptBody receipt={receipt.data} />}
    </DetailSheet>
  )
}

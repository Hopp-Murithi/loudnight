"use client"

import { useQuery } from "@tanstack/react-query"
import { conceptsApi } from "../api"

// A claim's receipt or a raw Qloo call's receipt. Both never change once written, so one fetch is enough.
export interface ReceiptSource {
  kind: "evidence" | "call"
  id: string
}

export function useReceipt(source: ReceiptSource | null) {
  return useQuery({
    queryKey: ["receipt", source?.kind, source?.id],
    queryFn: () =>
      source?.kind === "call" ? conceptsApi.callReceipt(source.id) : conceptsApi.receipt(source?.id ?? ""),
    enabled: source !== null,
    staleTime: Infinity,
  })
}

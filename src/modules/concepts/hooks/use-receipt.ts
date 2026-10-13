"use client"

import { useQuery } from "@tanstack/react-query"
import { conceptsApi } from "../api"

// A claim's receipt, a raw Qloo call's, or a performer's overlap. None change once written, so one fetch is enough.
export interface ReceiptSource {
  kind: "evidence" | "call" | "talent"
  id: string
}

const FETCH = { evidence: conceptsApi.receipt, call: conceptsApi.callReceipt, talent: conceptsApi.talentReceipt }

export function useReceipt(source: ReceiptSource | null) {
  return useQuery({
    queryKey: ["receipt", source?.kind, source?.id],
    queryFn: () => FETCH[source?.kind ?? "evidence"](source?.id ?? ""),
    enabled: source !== null,
    staleTime: Infinity,
  })
}

"use client"

import { Check, Copy } from "lucide-react"
import { useEffect, useState, type ComponentProps } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface CopyButtonProps extends Omit<ComponentProps<typeof Button>, "onClick" | "children"> {
  text: string
  label?: string
  copiedLabel?: string
}

const RESET_MS = 2000

// Copies in one tap and says so out loud. If the browser refuses, it tells the person how to copy by hand.
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "outline",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), RESET_MS)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      toast.error("Could not copy. Select the text and copy it instead.")
    }
  }

  return (
    <Button variant={variant} onClick={copy} {...props}>
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  )
}

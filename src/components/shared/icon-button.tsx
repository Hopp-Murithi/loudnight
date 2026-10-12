"use client"

import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface IconButtonProps extends Omit<ComponentProps<typeof Button>, "size" | "children"> {
  label: string
  children: React.ReactNode
}

// Every icon-only control gets an accessible name and a tooltip that says the same thing.
export function IconButton({ label, children, variant = "ghost", ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant={variant} size="icon" aria-label={label} {...props} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

"use client"

import { PanelLeft } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
import { useSidebar } from "@/components/ui/sidebar"

export function SidebarToggle() {
  const { toggleSidebar, state, isMobile } = useSidebar()
  const label = isMobile ? "Open menu" : state === "expanded" ? "Collapse sidebar" : "Expand sidebar"

  return (
    <IconButton label={label} onClick={toggleSidebar}>
      <PanelLeft className="size-4" aria-hidden />
    </IconButton>
  )
}

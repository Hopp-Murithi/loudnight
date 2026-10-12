"use client"

import { Mail, UserRound } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ROUTES } from "@/config/site"
import type { CurrentUser } from "@/modules/auth/types"

export const accountName = (user: Pick<CurrentUser, "displayName" | "isAnonymous">) =>
  user.displayName ?? (user.isAnonymous ? "Guest owner" : "Your account")

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "E"

// Sign out arrives with the session endpoints in plan 03; until then the menu only offers what works.
export function AccountMenu({ user }: { user: CurrentUser }) {
  const name = accountName(user)

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Account menu" />} />}
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initial(name)}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>Account</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{name}</p>
            {user.isAnonymous && <p className="text-xs font-normal">Not saved to an email yet</p>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROUTES.account} />}>
          <UserRound className="size-4" aria-hidden />
          Account
        </DropdownMenuItem>
        {user.isAnonymous && (
          <DropdownMenuItem render={<Link href={ROUTES.account} />}>
            <Mail className="size-4" aria-hidden />
            Keep your venues: add your email
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

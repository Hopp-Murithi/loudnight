"use client"

import { LogOut, UserRound } from "lucide-react"
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
import { useLogout } from "@/modules/auth/hooks/use-auth-mutations"
import type { CurrentUser } from "@/modules/auth/types"

export const accountName = (user: Pick<CurrentUser, "displayName" | "email">) =>
  user.displayName ?? user.email ?? "Your account"

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "E"

export function AccountMenu({ user }: { user: CurrentUser }) {
  const logout = useLogout()
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
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            {user.email && user.email !== name && <p className="truncate text-xs font-normal">{user.email}</p>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROUTES.account} />}>
          <UserRound className="size-4" aria-hidden />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

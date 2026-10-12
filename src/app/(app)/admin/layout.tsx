import { ROLES } from "@/config/roles"
import { getPageContext } from "@/modules/auth/server/context"

// Administrators only. The proxy and the API check too; this stops the page from rendering for anyone else.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await getPageContext(ROLES.administrator)
  return children
}

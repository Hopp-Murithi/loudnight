import { apiFetch } from "@/lib/http/client"

export const previewApi = {
  start: (userId: string) => apiFetch<{ previewing: true }>("/admin/preview", { method: "POST", body: { userId } }),
  end: () => apiFetch<{ previewing: false }>("/preview", { method: "DELETE" }),
}

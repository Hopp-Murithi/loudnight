// Saves a file the browser made itself, such as an ad image or video, under a readable name.
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Hands a file to the phone's own share sheet. False when this browser cannot share files, so the caller can save it.
export async function shareFile(file: File, text: string): Promise<boolean> {
  const data = { files: [file], text }
  if (typeof navigator.share !== "function" || !navigator.canShare?.(data)) return false
  try {
    await navigator.share(data)
    return true
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
  }
}

export const fileSlug = (name: string) =>
  name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "ad"

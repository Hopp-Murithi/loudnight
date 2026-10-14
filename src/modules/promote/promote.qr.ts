import qrcode from "qrcode-generator"

// The squares of a QR code for a link, true where a square is dark. Medium error correction survives a poster's print.
export function qrMatrix(link: string): boolean[][] {
  const code = qrcode(0, "M")
  code.addData(link)
  code.make()
  const count = code.getModuleCount()
  return Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, column) => code.isDark(row, column)),
  )
}

import { StyleSheet } from "react-native"

// The Loudnight night palette: late-night ink with spotlight amber, as on the web app's dark theme.
export const colors = {
  ink: "#120e0c",
  card: "#1c1613",
  line: "#3a302a",
  text: "#f7f3ed",
  muted: "#b7aa9c",
  spotlight: "#f2b860",
  good: "#3ecf8e",
  warn: "#f5a524",
  bad: "#ef5350",
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, padding: 16, gap: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  text: { color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    gap: 8,
  },
  input: {
    minHeight: 48,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: 4,
    backgroundColor: colors.spotlight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonText: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  ghost: {
    minHeight: 52,
    borderRadius: 4,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  ghostText: { color: colors.text, fontSize: 17, fontWeight: "600" },
})

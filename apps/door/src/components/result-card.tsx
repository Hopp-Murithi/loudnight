import { StyleSheet, Text, View } from "react-native"
import type { Arrival } from "../hooks/use-arrivals"
import { colors } from "../theme"

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

function describe(arrival: Arrival): { tone: string; title: string; detail: string } {
  if (arrival.kind === "in")
    return {
      tone: colors.good,
      title: `${arrival.result.name}: in`,
      detail: `Party of ${arrival.result.partySize}. Ticket used.`,
    }
  if (arrival.kind === "already")
    return {
      tone: colors.warn,
      title: `${arrival.result.name} already came in`,
      detail: `First in at ${time(arrival.result.at)}. Not counted again.`,
    }
  if (arrival.kind === "saved")
    return {
      tone: colors.spotlight,
      title: "Saved on this phone",
      detail: "It checks in as soon as you are back online.",
    }
  return { tone: colors.bad, title: "Not let in", detail: arrival.message }
}

// The result of one scan, in words and colour, read out by screen readers as it appears.
export function ResultCard({ arrival }: { arrival: Arrival }) {
  const { tone, title, detail } = describe(arrival)
  return (
    <View accessibilityLiveRegion="assertive" style={[styles.card, { borderColor: tone }]}>
      <View style={[styles.bar, { backgroundColor: tone }]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 2, borderRadius: 4, padding: 16, gap: 6 },
  bar: { height: 4, width: 48, borderRadius: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  detail: { color: colors.muted, fontSize: 16 },
})

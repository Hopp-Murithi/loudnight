import { StyleSheet, Text, View } from "react-native"
import type { DoorView } from "../lib/types"
import { colors, ui } from "../theme"

// People through the door against break-even, as large as the screen allows, with a meter for the gap.
export function DoorCount({ door }: { door: DoorView }) {
  const { arrived, toBreakEven, walkIns, rsvps } = door.numbers
  const target = door.breakEven
  const share = target ? Math.min(1, arrived / target) : 0
  return (
    <View
      style={ui.card}
      accessibilityRole="summary"
      accessibilityLabel={`${arrived} in${target ? ` of ${target} to break even` : ""}`}
    >
      <View style={styles.row}>
        <Text style={styles.count}>{arrived}</Text>
        <Text style={styles.of}>{target ? `of ${target} to break even` : "in tonight"}</Text>
      </View>
      {target !== null && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${share * 100}%` }]} />
        </View>
      )}
      <Text style={ui.muted}>
        {rsvps} saved places, {walkIns} walk-ins{target ? `, ${toBreakEven} more to break even` : ""}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  count: { color: colors.text, fontSize: 64, fontWeight: "900", lineHeight: 68 },
  of: { color: colors.muted, fontSize: 18, fontWeight: "600" },
  track: { height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, backgroundColor: colors.spotlight },
})

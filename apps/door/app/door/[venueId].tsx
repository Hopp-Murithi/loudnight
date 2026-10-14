import * as Haptics from "expo-haptics"
import { useKeepAwake } from "expo-keep-awake"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native"
import { DoorCount } from "../../src/components/door-count"
import { ResultCard } from "../../src/components/result-card"
import { type Arrival, useArrivals } from "../../src/hooks/use-arrivals"
import { useDoor } from "../../src/hooks/use-door"
import { colors, ui } from "../../src/theme"

// Tonight at the door: the live count, then scan, find a name or count a walk-in. The screen stays awake.
export default function Door() {
  useKeepAwake()
  const { venueId } = useLocalSearchParams<{ venueId: string }>()
  const door = useDoor(venueId)
  const arrivals = useArrivals(venueId, door.data?.night.id)
  const [search, setSearch] = useState("")
  const [party, setParty] = useState(1)
  const [last, setLast] = useState<Arrival | null>(null)

  const guests = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? (door.data?.guests ?? []).filter((guest) => guest.name.toLowerCase().includes(term)).slice(0, 20) : []
  }, [door.data, search])

  if (door.isLoading) return <ActivityIndicator style={ui.screen} color={colors.spotlight} />
  if (!door.data)
    return (
      <View style={ui.screen}>
        <Text style={ui.title}>No night is on yet</Text>
        <Text style={ui.muted}>When the owner publishes a night, its guest list opens here.</Text>
      </View>
    )

  const show = (arrival: Arrival) => {
    setLast(arrival)
    Haptics.notificationAsync(
      arrival.kind === "in" || arrival.kind === "saved"
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    )
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.ink }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      data={guests}
      keyExtractor={(guest) => guest.id}
      ListHeaderComponent={
        <View style={{ gap: 16 }}>
          <Text style={ui.title}>{door.data.night.title}</Text>
          {arrivals.waiting > 0 && (
            <Pressable style={[ui.card, { borderColor: colors.spotlight }]} onPress={arrivals.sync}>
              <Text style={ui.text}>{arrivals.waiting} arrivals waiting to sync. Tap to try now.</Text>
            </Pressable>
          )}
          <DoorCount door={door.data} />
          {last && <ResultCard arrival={last} />}
          <Pressable
            style={[ui.button, { minHeight: 64 }]}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/scan", params: { venueId, nightId: door.data?.night.id } })}
          >
            <Text style={[ui.buttonText, { fontSize: 20 }]}>Scan tickets</Text>
          </Pressable>
          <View style={[ui.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
            <Text style={[ui.text, { flex: 1 }]}>Walk-in</Text>
            <Pressable
              style={ui.ghost}
              onPress={() => setParty((n) => Math.max(1, n - 1))}
              accessibilityLabel="One fewer"
            >
              <Text style={ui.ghostText}>-</Text>
            </Pressable>
            <Text style={[ui.text, { fontSize: 22, minWidth: 28, textAlign: "center" }]}>{party}</Text>
            <Pressable
              style={ui.ghost}
              onPress={() => setParty((n) => Math.min(10, n + 1))}
              accessibilityLabel="One more"
            >
              <Text style={ui.ghostText}>+</Text>
            </Pressable>
            <Pressable style={ui.button} onPress={async () => show(await arrivals.walkIn(party))}>
              <Text style={ui.buttonText}>In</Text>
            </Pressable>
          </View>
          <TextInput
            style={ui.input}
            placeholder="Find a name"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Find a guest by name"
          />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[ui.card, { flexDirection: "row", alignItems: "center", minHeight: 56 }]}
          disabled={item.arrivedAt !== null}
          onPress={async () => show(await arrivals.send({ rsvpId: item.id }))}
          accessibilityRole="button"
        >
          <Text style={[ui.text, { flex: 1 }]}>
            {item.name}, party of {item.partySize}
          </Text>
          <Text style={{ color: item.arrivedAt ? colors.good : colors.spotlight, fontWeight: "700" }}>
            {item.arrivedAt ? "In" : "Check in"}
          </Text>
        </Pressable>
      )}
    />
  )
}

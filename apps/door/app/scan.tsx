import { CameraView, useCameraPermissions } from "expo-camera"
import * as Haptics from "expo-haptics"
import { useKeepAwake } from "expo-keep-awake"
import { router, useLocalSearchParams } from "expo-router"
import { useRef, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ResultCard } from "../src/components/result-card"
import { RESULT_MS } from "../src/config"
import { type Arrival, useArrivals } from "../src/hooks/use-arrivals"
import { colors, ui } from "../src/theme"

const FEEL: Record<Arrival["kind"], Haptics.NotificationFeedbackType> = {
  in: Haptics.NotificationFeedbackType.Success,
  saved: Haptics.NotificationFeedbackType.Success,
  already: Haptics.NotificationFeedbackType.Warning,
  refused: Haptics.NotificationFeedbackType.Error,
}

// Full-screen scanning. Each ticket is sent as read; the server says whether it lets the guest in and uses it up.
export default function Scan() {
  useKeepAwake()
  const { venueId, nightId } = useLocalSearchParams<{ venueId: string; nightId: string }>()
  const arrivals = useArrivals(venueId, nightId)
  const [permission, ask] = useCameraPermissions()
  const [result, setResult] = useState<Arrival | null>(null)
  const [typed, setTyped] = useState("")
  const busy = useRef(false)

  const check = async (text: string) => {
    if (busy.current || !text.trim()) return
    busy.current = true
    const arrival = await arrivals.send({ code: text })
    setResult(arrival)
    Haptics.notificationAsync(FEEL[arrival.kind])
    setTimeout(() => {
      busy.current = false
    }, RESULT_MS)
  }

  if (!permission) return <View style={ui.screen} />
  if (!permission.granted)
    return (
      <SafeAreaView style={[ui.screen, { justifyContent: "center" }]}>
        <Text style={ui.title}>Camera needed</Text>
        <Text style={ui.muted}>Loudnight uses the camera only to read tickets at the door.</Text>
        <Pressable style={ui.button} onPress={ask}>
          <Text style={ui.buttonText}>Allow the camera</Text>
        </Pressable>
        <Pressable style={ui.ghost} onPress={() => router.back()}>
          <Text style={ui.ghostText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    )

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => check(data)}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.frame} accessibilityLabel="Point the camera at a ticket" />
        <View style={{ gap: 12 }}>
          {result && <ResultCard arrival={result} />}
          {arrivals.waiting > 0 && <Text style={ui.text}>{arrivals.waiting} arrivals waiting to sync</Text>}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              style={[ui.input, { flex: 1, backgroundColor: colors.card }]}
              placeholder="Or type the ticket code"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              value={typed}
              onChangeText={setTyped}
              onSubmitEditing={() => check(typed).then(() => setTyped(""))}
              accessibilityLabel="Ticket code"
            />
            <Pressable style={ui.button} onPress={() => check(typed).then(() => setTyped(""))}>
              <Text style={ui.buttonText}>Check</Text>
            </Pressable>
          </View>
          <Pressable style={[ui.ghost, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <Text style={ui.ghostText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "space-between", padding: 16 },
  frame: {
    alignSelf: "center",
    marginTop: 80,
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: colors.spotlight,
    borderRadius: 4,
  },
})

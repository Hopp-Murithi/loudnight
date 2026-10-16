import { router } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { useVenues } from "../hooks/use-door"
import { useSignOut } from "../hooks/use-session"
import { ui } from "../theme"

// Ways out of a venue's door: to another venue this person works at, or signing out on a shared phone.
export function DoorFooter() {
  const venues = useVenues()
  const signOut = useSignOut()
  return (
    <View style={{ gap: 8, paddingTop: 8 }}>
      {(venues.data?.length ?? 0) > 1 && (
        <Pressable style={ui.ghost} onPress={() => router.replace("/venues")} accessibilityRole="button">
          <Text style={ui.ghostText}>Switch venue</Text>
        </Pressable>
      )}
      <Pressable style={ui.ghost} onPress={signOut} accessibilityRole="button">
        <Text style={ui.ghostText}>Sign out</Text>
      </Pressable>
    </View>
  )
}

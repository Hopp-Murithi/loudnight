import { Redirect, router } from "expo-router"
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native"
import { useVenues } from "../src/hooks/use-door"
import { useSession, useSignOut } from "../src/hooks/use-session"
import { colors, ui } from "../src/theme"

const ROLE: Record<string, string> = { owner: "Owner", manager: "Manager", door: "Door staff" }

// The venues where this person is on the team, with their role at each. The server decides the list.
export default function Venues() {
  const session = useSession()
  const venues = useVenues()
  const signOut = useSignOut()
  if (session === null) return <Redirect href="/" />
  const list = venues.data ?? []
  const [only] = list
  // One team: straight to its door. Several, at different venues or in different roles: the person chooses.
  if (list.length === 1 && only)
    return <Redirect href={{ pathname: "/door/[venueId]", params: { venueId: only.id } }} />

  return (
    <View style={ui.screen}>
      {venues.isLoading ? (
        <ActivityIndicator color={colors.spotlight} />
      ) : venues.isError ? (
        <Pressable style={ui.ghost} onPress={() => venues.refetch()}>
          <Text style={ui.ghostText}>Could not load your venues. Try again</Text>
        </Pressable>
      ) : (
        <FlatList
          data={list}
          ListHeaderComponent={list.length > 1 ? <Text style={ui.title}>Choose a venue</Text> : null}
          keyExtractor={(venue) => venue.id}
          contentContainerStyle={{ gap: 12 }}
          ListEmptyComponent={
            <Text style={ui.muted}>You are not on any venue's team yet. Ask the owner to add you.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={ui.card}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/door/[venueId]", params: { venueId: item.id } })}
            >
              <Text style={[ui.text, { fontSize: 20, fontWeight: "700" }]}>{item.name}</Text>
              <Text style={ui.muted}>
                {ROLE[item.role] ?? item.role}, {item.city ?? item.address}
              </Text>
            </Pressable>
          )}
        />
      )}
      <Pressable style={ui.ghost} onPress={signOut} accessibilityRole="button">
        <Text style={ui.ghostText}>Sign out</Text>
      </Pressable>
    </View>
  )
}

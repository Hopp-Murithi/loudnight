import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { colors } from "../src/theme"

export default function RootLayout() {
  const [queries] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }))
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queries}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.ink },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.ink },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="venues" options={{ title: "Your venues" }} />
          <Stack.Screen name="door/[venueId]" options={{ title: "The door" }} />
          <Stack.Screen name="scan" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

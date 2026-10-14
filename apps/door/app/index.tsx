import { Redirect } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { signIn, useSession } from "../src/hooks/use-session"
import { colors, ui } from "../src/theme"

// Sign in once with the same account as the web app. The phone remembers it in its secure keychain.
export default function SignIn() {
  const session = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session === undefined)
    return (
      <View style={[ui.screen, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.spotlight} />
      </View>
    )
  if (session) return <Redirect href="/venues" />

  const submit = async () => {
    setBusy(true)
    setError(await signIn(email, password))
    setBusy(false)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ink }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[ui.screen, { justifyContent: "center" }]}
      >
        <Text style={ui.title}>Loudnight Door</Text>
        <Text style={ui.muted}>Sign in with your Loudnight account to check guests in.</Text>
        <TextInput
          style={ui.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Email"
        />
        <TextInput
          style={ui.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
          accessibilityLabel="Password"
        />
        {error && (
          <Text style={{ color: colors.bad }} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
        <Pressable style={ui.button} onPress={submit} disabled={busy} accessibilityRole="button">
          <Text style={ui.buttonText}>{busy ? "Signing in" : "Sign in"}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

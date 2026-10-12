// Runs every file in supabase/tests against the local database (`supabase start`). Each file proves its rules
// by raising "... ASSERTIONS PASSED" at the end, which also rolls back everything it created.
import { spawnSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"

const CONTAINER = "supabase_db_encore"
const files = readdirSync("supabase/tests").filter((file) => file.endsWith(".sql"))

const failures = files.filter((file) => {
  const result = spawnSync("docker", ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-q"], {
    input: readFileSync(`supabase/tests/${file}`, "utf8"),
    encoding: "utf8",
  })
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`
  const passed = /ASSERTIONS PASSED/.test(output)
  console.log(`${passed ? "PASS" : "FAIL"} ${file}`)
  if (!passed) console.error(output.trim())
  return !passed
})

process.exit(failures.length > 0 ? 1 : 0)

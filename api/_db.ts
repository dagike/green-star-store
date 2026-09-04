// Shared Neon client for serverless functions. `neon()` talks to Postgres over HTTP,
// so there's no connection pool to exhaust across concurrent function invocations -
// the module-scoped instance below is just reused on warm invocations.
import { neon } from '@neondatabase/serverless'

let sql: ReturnType<typeof neon> | null = null

export function getSql() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }
    sql = neon(connectionString)
  }
  return sql
}

import { ApiKey } from '../models/api-key.model'

const TTL_MS = 60_000

let cache: { origins: Set<string>; expiresAt: number } = {
  origins: new Set<string>(),
  expiresAt: 0,
}

function envOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function getAllowedOrigins(): Promise<Set<string>> {
  if (Date.now() < cache.expiresAt) return cache.origins
  const keys = await ApiKey.find(
    { revokedAt: { $exists: false } },
    { allowedOrigins: 1 },
  ).lean<{ allowedOrigins?: string[] }[]>()
  const all = new Set<string>(envOrigins())
  for (const k of keys) {
    for (const o of k.allowedOrigins ?? []) all.add(o)
  }
  cache = { origins: all, expiresAt: Date.now() + TTL_MS }
  return all
}

export function isOriginAllowedFromEnv(origin: string): boolean {
  return envOrigins().includes(origin)
}

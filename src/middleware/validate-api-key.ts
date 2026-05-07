import crypto from 'crypto'
import { FastifyRequest, FastifyReply } from 'fastify'
import { ApiKey } from '../models/api-key.model'
import { isOriginAllowedFromEnv } from '../services/origin-cache'
import { config } from '../config'

declare module 'fastify' {
  interface FastifyRequest {
    companyId?: string
    apiKeyId?: string
  }
}

export async function validateApiKey(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawKey = request.headers['x-api-key']
  if (!rawKey || typeof rawKey !== 'string') {
    reply.status(401).send({ error: 'Missing X-Api-Key header' })
    return
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const record = await ApiKey.findOne({ keyHash, revokedAt: { $exists: false } })

  if (!record) {
    reply.status(401).send({ error: 'Invalid or revoked API key' })
    return
  }

  // Defense-in-depth: in production, if the request came from a browser
  // (Origin header set), require the origin to be either in this key's
  // allowedOrigins or in the global env ALLOWED_ORIGINS. Prevents one key's
  // Origin allowlist from being usable through a different key.
  if (config.nodeEnv === 'production') {
    const origin = request.headers.origin
    if (origin && typeof origin === 'string') {
      const keyAllows = (record.allowedOrigins ?? []).includes(origin)
      if (!keyAllows && !isOriginAllowedFromEnv(origin)) {
        reply.status(403).send({ error: `Origin "${origin}" is not allowed for this API key` })
        return
      }
    }
  }

  request.companyId = record.companyId.toString()
  request.apiKeyId = record._id.toString()
}

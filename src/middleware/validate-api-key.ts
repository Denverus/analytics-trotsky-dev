import crypto from 'crypto'
import { FastifyRequest, FastifyReply } from 'fastify'
import { ApiKey } from '../models/api-key.model'

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

  request.companyId = record.companyId.toString()
  request.apiKeyId = record._id.toString()
}

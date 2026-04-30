import { FastifyPluginAsync } from 'fastify'
import mongoose from 'mongoose'
import { requireAuth } from '../../middleware/require-auth'
import { getSessionStats, getEventStats, getSessionDurationStats, getEntityStats } from './stats.service'

function parseApiKeyIds(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (ids.length === 0) return undefined
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid apiKeyId: ${id}`)
    }
  }
  return ids
}

const statsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAuth)

  const querySchema = {
    type: 'object',
    required: ['companyId'],
    properties: {
      companyId: { type: 'string' },
      apiKeyIds: { type: 'string' },
      from: { type: 'string', format: 'date-time' },
      to: { type: 'string', format: 'date-time' },
    },
  }

  const entityQuerySchema = {
    type: 'object',
    required: ['companyId'],
    properties: {
      companyId: { type: 'string' },
      apiKeyIds: { type: 'string' },
      entityType: { type: 'string' },
      from: { type: 'string', format: 'date-time' },
      to: { type: 'string', format: 'date-time' },
    },
  }

  fastify.get<{ Querystring: { companyId: string; apiKeyIds?: string; from?: string; to?: string } }>(
    '/sessions',
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const { companyId, apiKeyIds, from, to } = request.query
      try {
        const ids = parseApiKeyIds(apiKeyIds)
        const stats = await getSessionStats(companyId, ids, from, to)
        return reply.send(stats)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid query'
        return reply.status(400).send({ error: message })
      }
    },
  )

  fastify.get<{ Querystring: { companyId: string; apiKeyIds?: string; from?: string; to?: string } }>(
    '/events',
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const { companyId, apiKeyIds, from, to } = request.query
      try {
        const ids = parseApiKeyIds(apiKeyIds)
        const stats = await getEventStats(companyId, ids, from, to)
        return reply.send(stats)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid query'
        return reply.status(400).send({ error: message })
      }
    },
  )

  fastify.get<{ Querystring: { companyId: string; apiKeyIds?: string; from?: string; to?: string } }>(
    '/session-duration',
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const { companyId, apiKeyIds, from, to } = request.query
      try {
        const ids = parseApiKeyIds(apiKeyIds)
        const stats = await getSessionDurationStats(companyId, ids, from, to)
        return reply.send(stats)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid query'
        return reply.status(400).send({ error: message })
      }
    },
  )

  fastify.get<{
    Querystring: { companyId: string; apiKeyIds?: string; entityType?: string; from?: string; to?: string }
  }>(
    '/entities',
    { schema: { querystring: entityQuerySchema } },
    async (request, reply) => {
      const { companyId, apiKeyIds, entityType, from, to } = request.query
      try {
        const ids = parseApiKeyIds(apiKeyIds)
        const stats = await getEntityStats(companyId, ids, entityType, from, to)
        return reply.send(stats)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid query'
        return reply.status(400).send({ error: message })
      }
    },
  )
}

export default statsRoutes

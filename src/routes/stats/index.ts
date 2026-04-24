import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../middleware/require-auth'
import { getSessionStats, getEventStats, getSessionDurationStats, getEntityStats } from './stats.service'

const statsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAuth)

  const querySchema = {
    type: 'object',
    required: ['companyId'],
    properties: {
      companyId: { type: 'string' },
      from: { type: 'string', format: 'date-time' },
      to: { type: 'string', format: 'date-time' },
    },
  }

  const entityQuerySchema = {
    type: 'object',
    required: ['companyId'],
    properties: {
      companyId: { type: 'string' },
      entityType: { type: 'string' },
      from: { type: 'string', format: 'date-time' },
      to: { type: 'string', format: 'date-time' },
    },
  }

  fastify.get<{ Querystring: { companyId: string; from?: string; to?: string } }>(
    '/sessions',
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const { companyId, from, to } = request.query
      try {
        const stats = await getSessionStats(companyId, from, to)
        return reply.send(stats)
      } catch {
        return reply.status(400).send({ error: 'Invalid companyId' })
      }
    },
  )

  fastify.get<{ Querystring: { companyId: string; from?: string; to?: string } }>(
    '/events',
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const { companyId, from, to } = request.query
      try {
        const stats = await getEventStats(companyId, from, to)
        return reply.send(stats)
      } catch {
        return reply.status(400).send({ error: 'Invalid companyId' })
      }
    },
  )

  fastify.get<{ Querystring: { companyId: string; from?: string; to?: string } }>(
    '/session-duration',
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const { companyId, from, to } = request.query
      try {
        const stats = await getSessionDurationStats(companyId, from, to)
        return reply.send(stats)
      } catch {
        return reply.status(400).send({ error: 'Invalid companyId' })
      }
    },
  )

  fastify.get<{ Querystring: { companyId: string; entityType?: string; from?: string; to?: string } }>(
    '/entities',
    { schema: { querystring: entityQuerySchema } },
    async (request, reply) => {
      const { companyId, entityType, from, to } = request.query
      try {
        const stats = await getEntityStats(companyId, entityType, from, to)
        return reply.send(stats)
      } catch {
        return reply.status(400).send({ error: 'Invalid companyId' })
      }
    },
  )
}

export default statsRoutes

import { FastifyPluginAsync } from 'fastify'
import mongoose from 'mongoose'
import { validateApiKey } from '../../middleware/validate-api-key'
import { Event } from '../../models/event.model'

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: {
      projectId: string
      eventName: string
      timestamp: string
      sessionId: string
      payload?: Record<string, unknown>
    }
  }>(
    '/',
    {
      preHandler: validateApiKey,
      schema: {
        body: {
          type: 'object',
          required: ['projectId', 'eventName', 'timestamp', 'sessionId'],
          properties: {
            projectId: { type: 'string', minLength: 1 },
            eventName: { type: 'string', minLength: 1 },
            timestamp: { type: 'string', format: 'date-time' },
            sessionId: { type: 'string', minLength: 1 },
            payload: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { projectId, eventName, timestamp, sessionId, payload } = request.body
      await Event.create({
        companyId: new mongoose.Types.ObjectId(request.companyId),
        apiKeyId: request.apiKeyId ? new mongoose.Types.ObjectId(request.apiKeyId) : undefined,
        projectId,
        eventName,
        timestamp: new Date(timestamp),
        sessionId,
        payload,
      })
      return reply.status(202).send({ ok: true })
    },
  )
}

export default eventsRoutes

import { FastifyPluginAsync } from 'fastify'
import mongoose from 'mongoose'

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async (_request, reply) => {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    return reply.send({ ok: true, db: dbState })
  })
}

export default healthRoute

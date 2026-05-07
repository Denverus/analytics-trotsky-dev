import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyCors from '@fastify/cors'
import { config } from '../config'
import { getAllowedOrigins } from '../services/origin-cache'

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    // @fastify/cors v9: async origin function must return a value, not use a callback.
    origin: async (origin) => {
      // No Origin header: same-origin or server-to-server — allow.
      if (!origin) return true
      // Dev: allow everything (matches prior behavior).
      if (config.nodeEnv !== 'production') return true
      try {
        const allowed = await getAllowedOrigins()
        return allowed.has(origin)
      } catch (err) {
        fastify.log.error({ err }, 'origin-cache lookup failed')
        return false
      }
    },
    credentials: true,
  })
}

export default fp(corsPlugin)

import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyCors from '@fastify/cors'
import { config } from '../config'
import { getAllowedOrigins } from '../services/origin-cache'

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: async (origin, cb) => {
      // No Origin header: same-origin or server-to-server — allow.
      if (!origin) return cb(null, true)
      // Dev: allow everything (matches prior behavior).
      if (config.nodeEnv !== 'production') return cb(null, true)
      try {
        const allowed = await getAllowedOrigins()
        cb(null, allowed.has(origin))
      } catch (err) {
        fastify.log.error({ err }, 'origin-cache lookup failed')
        cb(null, false)
      }
    },
    credentials: true,
  })
}

export default fp(corsPlugin)

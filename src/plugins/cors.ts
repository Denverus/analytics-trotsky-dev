import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyCors from '@fastify/cors'
import { config } from '../config'

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: config.nodeEnv === 'production'
      ? (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)
      : true,
    credentials: true,
  })
}

export default fp(corsPlugin)

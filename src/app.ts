import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import corsPlugin from './plugins/cors'
import mongoPlugin from './plugins/mongo'
import healthRoute from './routes/health'
import snippetRoute from './routes/snippet'
import eventsRoutes from './routes/events'
import statsRoutes from './routes/stats'
import { config } from './config'

export async function buildApp() {
  const fastify = Fastify({
    logger: config.nodeEnv !== 'test',
  })

  await fastify.register(corsPlugin)
  await fastify.register(fastifyCookie)
  await fastify.register(mongoPlugin)

  await fastify.register(healthRoute)
  await fastify.register(snippetRoute)
  await fastify.register(eventsRoutes, { prefix: '/api/events' })
  await fastify.register(statsRoutes, { prefix: '/api/stats' })

  return fastify
}

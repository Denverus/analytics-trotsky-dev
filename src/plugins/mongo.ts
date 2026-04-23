import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import mongoose from 'mongoose'
import { config } from '../config'

const mongoPlugin: FastifyPluginAsync = async (fastify) => {
  await mongoose.connect(config.mongoUri)
  fastify.log.info('MongoDB connected')

  fastify.addHook('onClose', async () => {
    await mongoose.disconnect()
    fastify.log.info('MongoDB disconnected')
  })
}

export default fp(mongoPlugin)

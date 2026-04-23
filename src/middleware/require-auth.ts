import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized' })
    return
  }
  const token = authHeader.slice(7)
  try {
    request.user = jwt.verify(token, config.jwtSecret) as JwtPayload
  } catch {
    reply.status(401).send({ error: 'Invalid or expired token' })
  }
}

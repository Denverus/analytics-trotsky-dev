import 'dotenv/config'

function required(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
}

import mongoose, { Schema, Document } from 'mongoose'

export interface IEvent extends Document {
  companyId: mongoose.Types.ObjectId
  apiKeyId?: mongoose.Types.ObjectId
  projectId: string
  eventName: string
  timestamp: Date
  sessionId: string
  payload?: Record<string, unknown>
  receivedAt: Date
}

const EventSchema = new Schema<IEvent>({
  companyId: { type: Schema.Types.ObjectId, required: true },
  apiKeyId: { type: Schema.Types.ObjectId },
  projectId: { type: String, required: true },
  eventName: { type: String, required: true },
  timestamp: { type: Date, required: true },
  sessionId: { type: String, required: true },
  payload: { type: Schema.Types.Mixed },
  receivedAt: { type: Date, required: true, default: () => new Date() },
})

EventSchema.index({ companyId: 1, timestamp: -1 })
EventSchema.index({ companyId: 1, apiKeyId: 1, timestamp: -1 })
EventSchema.index({ companyId: 1, eventName: 1 })
EventSchema.index({ companyId: 1, sessionId: 1 })
// TTL: auto-delete events older than 90 days
EventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

export const Event = mongoose.model<IEvent>('Event', EventSchema)

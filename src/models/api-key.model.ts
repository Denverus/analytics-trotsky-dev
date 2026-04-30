import mongoose, { Schema, Document } from 'mongoose'

export interface IApiKey extends Document {
  companyId: mongoose.Types.ObjectId
  serviceId: string
  name: string
  keyHash: string
  createdAt: Date
  revokedAt?: Date
}

// Explicit collection name keeps this in sync with platform-service without code sharing
const ApiKeySchema = new Schema<IApiKey>(
  {
    companyId: { type: Schema.Types.ObjectId, required: true },
    serviceId: { type: String, required: true },
    name: { type: String, required: true },
    keyHash: { type: String, required: true },
    revokedAt: { type: Date },
  },
  { collection: 'apikeys', timestamps: { createdAt: true, updatedAt: false } },
)

ApiKeySchema.index({ keyHash: 1 })

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema)

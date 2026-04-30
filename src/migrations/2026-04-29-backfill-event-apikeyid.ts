import mongoose from 'mongoose'
import { config } from '../config'
import { ApiKey } from '../models/api-key.model'
import { Event } from '../models/event.model'

async function run() {
  await mongoose.connect(config.mongoUri)
  console.log('MongoDB connected')

  const companyIds: mongoose.Types.ObjectId[] = await Event.distinct('companyId', {
    apiKeyId: { $exists: false },
  })
  console.log(`Found ${companyIds.length} company/companies with un-tagged events`)

  let totalUpdated = 0
  for (const companyId of companyIds) {
    const activeAnalyticsKeys = await ApiKey.find({
      companyId,
      serviceId: 'analytics',
      revokedAt: { $exists: false },
    })

    let chosenKey
    if (activeAnalyticsKeys.length === 1) {
      chosenKey = activeAnalyticsKeys[0]
    } else if (activeAnalyticsKeys.length === 0) {
      // fall back to any analytics key (revoked or not) — required to retain events
      const anyKey = await ApiKey.findOne({ companyId, serviceId: 'analytics' }).sort({ createdAt: 1 })
      if (!anyKey) {
        console.warn(`Company ${companyId.toString()}: no analytics key at all — skipping`)
        continue
      }
      console.warn(`Company ${companyId.toString()}: no active analytics key, using earliest "${anyKey.name}" (${anyKey._id})`)
      chosenKey = anyKey
    } else {
      console.warn(
        `Company ${companyId.toString()}: ${activeAnalyticsKeys.length} active analytics keys — ambiguous, skipping. Backfill manually.`,
      )
      continue
    }

    const result = await Event.updateMany(
      { companyId, apiKeyId: { $exists: false } },
      { $set: { apiKeyId: chosenKey._id } },
    )
    totalUpdated += result.modifiedCount
    console.log(`Company ${companyId.toString()}: tagged ${result.modifiedCount} event(s) with key "${chosenKey.name}"`)
  }

  console.log(`Done. Total events backfilled: ${totalUpdated}`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

import mongoose from 'mongoose'
import { Event } from '../../models/event.model'

export interface EntityStats {
  total: number
  byEntity: {
    entityId: string
    entityType: string
    entityName: string
    starts: number
    completions: number
    completionRate: number
    avgDurationMs: number
  }[]
  byDay: { date: string; count: number }[]
}

export async function getEntityStats(
  companyId: string,
  entityType?: string,
  from?: string,
  to?: string,
): Promise<EntityStats> {
  const baseMatch: Record<string, unknown> = {
    companyId: new mongoose.Types.ObjectId(companyId),
  }
  if (from || to) {
    baseMatch.timestamp = {}
    if (from) (baseMatch.timestamp as Record<string, unknown>)['$gte'] = new Date(from)
    if (to) (baseMatch.timestamp as Record<string, unknown>)['$lte'] = new Date(to)
  }
  if (entityType) {
    baseMatch['payload.entityType'] = entityType
  }

  const startsResult = await Event.aggregate([
    { $match: { ...baseMatch, eventName: 'entity_started' } },
    {
      $group: {
        _id: '$payload.entityId',
        starts: { $sum: 1 },
        entityName: { $first: '$payload.entityName' },
        entityType: { $first: '$payload.entityType' },
      },
    },
  ])

  const completionsResult = await Event.aggregate([
    { $match: { ...baseMatch, eventName: 'entity_completed' } },
    {
      $group: {
        _id: '$payload.entityId',
        completions: { $sum: 1 },
        avgDurationMs: { $avg: '$payload.duration_ms' },
      },
    },
  ])

  const byDayResult = await Event.aggregate([
    { $match: { ...baseMatch, eventName: 'entity_started' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ])

  const completionsMap = new Map(
    completionsResult.map((r) => [String(r._id), { completions: r.completions as number, avgDurationMs: Math.round(r.avgDurationMs as number) }]),
  )

  const byEntity = startsResult.map((r) => {
    const c = completionsMap.get(String(r._id))
    const starts = r.starts as number
    const completions = c?.completions ?? 0
    return {
      entityId: String(r._id),
      entityType: (r.entityType as string) ?? '',
      entityName: (r.entityName as string) ?? '',
      starts,
      completions,
      completionRate: starts > 0 ? completions / starts : 0,
      avgDurationMs: c?.avgDurationMs ?? 0,
    }
  })

  byEntity.sort((a, b) => b.starts - a.starts)

  return {
    total: byEntity.reduce((sum, e) => sum + e.starts, 0),
    byEntity,
    byDay: byDayResult,
  }
}

function companyMatch(companyId: string, from?: string, to?: string) {
  const match: Record<string, unknown> = {
    companyId: new mongoose.Types.ObjectId(companyId),
  }
  if (from || to) {
    match.timestamp = {}
    if (from) (match.timestamp as Record<string, unknown>)['$gte'] = new Date(from)
    if (to) (match.timestamp as Record<string, unknown>)['$lte'] = new Date(to)
  }
  return match
}

export interface SessionStats {
  total: number
  byDay: { date: string; sessions: number }[]
}

export async function getSessionStats(
  companyId: string,
  from?: string,
  to?: string,
): Promise<SessionStats> {
  const result = await Event.aggregate([
    { $match: companyMatch(companyId, from, to) },
    {
      $group: {
        _id: {
          sessionId: '$sessionId',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        },
      },
    },
    { $group: { _id: '$_id.date', sessions: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', sessions: 1 } },
  ])

  const total = result.reduce((sum, d) => sum + d.sessions, 0)
  return { total, byDay: result }
}

export interface EventStats {
  total: number
  topEvents: { eventName: string; count: number }[]
}

export async function getEventStats(
  companyId: string,
  from?: string,
  to?: string,
): Promise<EventStats> {
  const result = await Event.aggregate([
    { $match: companyMatch(companyId, from, to) },
    { $group: { _id: '$eventName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
    { $project: { _id: 0, eventName: '$_id', count: 1 } },
  ])

  const total = result.reduce((sum, e) => sum + e.count, 0)
  return { total, topEvents: result }
}

export interface DurationStats {
  avg: number
  p50: number
  p90: number
  sampleSize: number
}

export async function getSessionDurationStats(
  companyId: string,
  from?: string,
  to?: string,
): Promise<DurationStats> {
  // Compute per-session duration as max(timestamp) - min(timestamp)
  const result = await Event.aggregate([
    { $match: companyMatch(companyId, from, to) },
    {
      $group: {
        _id: '$sessionId',
        minTime: { $min: '$timestamp' },
        maxTime: { $max: '$timestamp' },
      },
    },
    {
      $project: {
        duration: { $subtract: ['$maxTime', '$minTime'] },
      },
    },
  ])

  if (result.length === 0) return { avg: 0, p50: 0, p90: 0, sampleSize: 0 }

  const durations = result.map((r) => r.duration as number).sort((a, b) => a - b)
  const avg = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
  const p50 = durations[Math.floor(durations.length * 0.5)]
  const p90 = durations[Math.floor(durations.length * 0.9)]

  return { avg, p50, p90, sampleSize: durations.length }
}

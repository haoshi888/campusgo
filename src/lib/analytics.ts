import { getSessionId } from './api'
import type { AnalyticsEventName } from '../types'

const firedOnce = new Set<string>()

export async function track(
  eventName: AnalyticsEventName,
  payload: { productId?: string; metadata?: Record<string, unknown>; onceKey?: string } = {},
) {
  if (payload.onceKey) {
    if (firedOnce.has(payload.onceKey)) return
    firedOnce.add(payload.onceKey)
  }
  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('campusgo_user_id') ? { 'x-user-id': localStorage.getItem('campusgo_user_id')! } : {}),
      },
      body: JSON.stringify({
        eventName,
        productId: payload.productId,
        metadata: payload.metadata || {},
        sessionId: getSessionId(),
      }),
      keepalive: true,
    })
  } catch {
    // Analytics should never interrupt the core experience.
  }
}

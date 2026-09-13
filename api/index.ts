import type { IncomingMessage, ServerResponse } from 'node:http'
import app from '../server/app.js'

type VercelRequest = IncomingMessage & { query?: Record<string, string | string[]> }

export default function handler(req: VercelRequest, res: ServerResponse) {
  const pathValue = Array.isArray(req.query?.path) ? req.query.path.join('/') : req.query?.path
  if (pathValue) {
    const url = new URL(req.url || '/', 'http://localhost')
    url.searchParams.delete('path')
    req.url = `/api/${pathValue}${url.search}`
  }
  return app(req as any, res as any)
}

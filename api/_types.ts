// Minimal structural stand-ins for Vercel's Node function request/response objects.
// Vercel's runtime adds `query` (parsed from the URL) and JSON helpers to the raw
// Node http objects, so these types describe exactly what handlers actually receive
// without pulling in the full @vercel/node package just for typings.
import type { IncomingMessage, ServerResponse } from 'node:http'

export interface ApiRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>
}

export interface ApiResponse extends ServerResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
}

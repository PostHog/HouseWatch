import { notification } from 'antd'

const JSON_CONTENT_TYPE = 'application/json'

/**
 * Error thrown when a response can't be treated as JSON – e.g. the backend or a
 * proxy handed back an HTML document (a 5xx gateway page, an auth redirect, or a
 * Django error page starting with `<!DOCTYPE html>`). Calling `.json()` on such a
 * body throws a cryptic `SyntaxError: Unexpected token '<'`; this gives us a clean,
 * catchable error instead.
 */
export class HttpResponseError extends Error {
    status: number
    contentType: string

    constructor(status: number, contentType: string, body?: string) {
        const snippet = (body || '').trim().slice(0, 200)
        super(
            `Expected a JSON response but received "${contentType || 'no content-type'}" (HTTP ${status}). ` +
                'The server may have returned an HTML error or redirect page.' +
                (snippet ? ` Response starts with: ${snippet}` : '')
        )
        this.name = 'HttpResponseError'
        this.status = status
        this.contentType = contentType
    }
}

/**
 * Wrapper around `fetch` that guards against non-JSON responses before parsing.
 *
 * It checks `response.ok` and the `content-type` header, and only calls `.json()`
 * when the body actually is JSON. When it isn't, it throws an `HttpResponseError`
 * (which callers can catch and surface gracefully) rather than letting `.json()`
 * blow up with an uncaught `SyntaxError`.
 *
 * JSON responses are returned as-is regardless of status code, so callers that
 * inspect error fields on non-2xx JSON bodies keep working.
 */
export async function fetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init)
    const contentType = response.headers.get('content-type') || ''

    if (!contentType.toLowerCase().includes(JSON_CONTENT_TYPE)) {
        const body = await response.text().catch(() => '')
        throw new HttpResponseError(response.status, contentType, body)
    }

    return response.json()
}

/**
 * Convenience wrapper that runs `fetchJson` and surfaces an antd notification if the
 * response isn't JSON (or the request fails), returning `undefined` instead of throwing.
 * Handy for the fire-and-forget loaders that don't have their own error handling.
 */
export async function fetchJsonWithNotification<T = any>(
    input: RequestInfo | URL,
    init?: RequestInit,
    message = 'Failed to load data'
): Promise<T | undefined> {
    try {
        return await fetchJson<T>(input, init)
    } catch (err) {
        notification.error({ message })
        return undefined
    }
}

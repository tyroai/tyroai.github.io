// Sahte backend yardımcıları.
export const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" }

export function json(body, status = 200, headers = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  })
}

export const noContent = () => new Response(null, { status: 204 })

export function svg(markup, status = 200) {
  return new Response(markup, { status, headers: { "content-type": "image/svg+xml" } })
}

/** OData koleksiyonu. */
export function odata(value, context = "$metadata#collection", extra = {}) {
  return json({ "@odata.context": `https://graph.microsoft.com/v1.0/${context}`, value, ...extra })
}

export function graphError(status, code, message) {
  return json({ error: { code, message, innerError: { date: new Date().toISOString() } } }, status)
}

export function parseBody(body) {
  if (!body) return null
  if (typeof body === "string") {
    try {
      return JSON.parse(body)
    } catch {
      return body
    }
  }
  return body
}

let counter = 0
export const uid = (prefix = "demo") => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

/** Aynı yol bir kez günlüğe yazılır: eksik uçları geliştirmede bulmak için. */
const seen = new Set()
export function logUnhandled(kind, method, url) {
  const key = `${kind} ${method} ${url.pathname}`
  if (seen.has(key)) return
  seen.add(key)
  console.info(`[demo] karşılanmamış ${kind} isteği: ${method} ${url.pathname}${url.search ? url.search.slice(0, 120) : ""}`)
}

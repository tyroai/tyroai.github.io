// Graph sahte katmanı için ortak yardımcılar: sayfalama, OData süzgeci, saat dilimi.
import { json } from "./util.js"
import { wallClock } from "../state.js"

export const CTX = "https://graph.microsoft.com/v1.0/$metadata"

/** `$top` / `$skip` / `$count` uygulanmış OData koleksiyonu (`@odata.nextLink` mutlak adres). */
export function paged(url, items, map = (x) => x, extra = {}) {
  const top = Number(url.searchParams.get("$top") ?? 100)
  const skip = Number(url.searchParams.get("$skip") ?? 0)
  const slice = items.slice(skip, skip + top)
  const body = { "@odata.context": CTX, ...extra }
  if (url.searchParams.get("$count") === "true") body["@odata.count"] = items.length
  body.value = slice.map(map)
  if (skip + top < items.length) {
    const next = new URL(url.toString())
    next.searchParams.set("$skip", String(skip + top))
    body["@odata.nextLink"] = next.toString()
  }
  return json(body)
}

/** Üst düzeyde (parantez ve tırnak dışında) `sep` ile böl. */
export function splitTop(text, sep) {
  const parts = []
  let depth = 0
  let quote = false
  let cur = ""
  for (let i = 0; i < text.length; ) {
    const ch = text[i]
    if (ch === "'") quote = !quote
    if (!quote) {
      if (ch === "(") depth++
      if (ch === ")") depth--
      if (depth === 0 && text.slice(i, i + sep.length).toLowerCase() === sep) {
        parts.push(cur)
        cur = ""
        i += sep.length
        continue
      }
    }
    cur += ch
    i++
  }
  parts.push(cur)
  return parts.map((s) => s.trim()).filter(Boolean)
}

/** `$filter` değerlendirici: bilinen kalıplar uygulanır, bilinmeyen koşul geçer (true). */
export function matchesFilter(filter, ev) {
  if (!filter) return true
  return splitTop(filter, " and ").every((c) => evalClause(c, ev))
}

function evalClause(raw, ev) {
  const clause = raw.trim()
  if (clause.startsWith("(") && clause.endsWith(")")) {
    const inner = clause.slice(1, -1)
    const ors = splitTop(inner, " or ")
    if (ors.length > 1) return ors.some((c) => evalClause(c, ev))
    return splitTop(inner, " and ").every((c) => evalClause(c, ev))
  }
  const ors = splitTop(clause, " or ")
  if (ors.length > 1) return ors.some((c) => evalClause(c, ev))
  return ev(clause)
}

/** Posta için koşul değerlendiricisi. */
export function mailClause(m) {
  return (c) => {
    let r
    if ((r = c.match(/^receivedDateTime ge (\S+)$/i))) return m.received >= new Date(r[1])
    if ((r = c.match(/^sentDateTime ge (\S+)$/i))) return false
    if (/^isRead eq false$/i.test(c)) return Boolean(m.unread)
    if (/^isRead eq true$/i.test(c)) return !m.unread
    if (/^hasAttachments eq true$/i.test(c)) return m.hasAttachments
    if ((r = c.match(/^importance eq '(\w+)'$/i))) return m.importance === r[1]
    if (/^flag\/flagStatus eq 'flagged'$/i.test(c)) return m.flagged
    if ((r = c.match(/^from\/emailAddress\/address eq '([^']+)'$/i))) return m.from.address.toLowerCase() === r[1].toLowerCase()
    if (/singleValueExtendedProperties\/any/i.test(c)) return false
    if (/^conversationId eq/i.test(c)) return false
    return true
  }
}

/** "YYYY-MM-DDTHH:mm:ss" (saat diliminde duvar saati) → Date. */
export function zonedToDate(text, tz) {
  const clean = String(text).replace(/\.\d+$/, "").replace(/Z$/, "")
  if (!tz || tz.toUpperCase() === "UTC") return new Date(`${clean}Z`)
  let guess = new Date(`${clean}Z`)
  for (let i = 0; i < 2; i++) {
    const shown = new Date(`${wallClock(guess, tz).replace(/\.\d+$/, "")}Z`)
    guess = new Date(guess.getTime() - (shown.getTime() - new Date(`${clean}Z`).getTime()))
  }
  return guess
}

export const preferTimeZone = (headers) =>
  /outlook\.timezone="([^"]+)"/i.exec(headers?.get?.("Prefer") ?? "")?.[1] ?? "UTC"

export const decode = (s) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** Türkçe harfleri sadeleştirip küçült: arama karşılaştırması için. */
export const fold = (s) =>
  String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")

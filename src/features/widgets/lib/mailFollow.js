/**
 * Bekleyen postalar › takip masası — saf kurallar (testli):
 * - bayraklı postalar vadesine göre: önce gecikenler (en çok geciken başta), sonra bugün, sonra
 *   yaklaşanlar; vadesizler sonda, en uzun bekleyen önce;
 * - "yanıt bekleyen": son 14 günde gönderdiğin, en az iki gündür kimsenin yanıtlamadığı postalar.
 */
export const AWAIT_DAYS = 14
export const AWAIT_MIN_DAYS = 2
export const AWAIT_MAX = 12
// Toplu gönderim (duyuru, bülten) takip sayılmaz.
const MAX_RECIPIENTS = 10
const DAY_MS = 86_400_000

/** Bayrağın vade günü: `YYYY-MM-DD` ya da `null` (Outlook vadeyi günün başı olarak yazar). */
export function flagDueKey(flag) {
  const raw = flag?.dueDateTime?.dateTime
  return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null
}

/** Bayraklıların takip sırası. */
export function sortFlagged(items) {
  const dated = items
    .filter((m) => m.due)
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))
  const undated = items
    .filter((m) => !m.due)
    .sort((a, b) => (a.received?.getTime() ?? 0) - (b.received?.getTime() ?? 0))
  return [...dated, ...undated]
}

const lower = (s) => String(s ?? "").toLowerCase()

/**
 * Gönderilmişlerden takip adayları: toplantı yanıtı değil, kendine değil, toplu değil, en az iki
 * günlük; aynı konuşmada yalnız en son gönderdiğin. `me`: kişinin adresleri (küçük harf).
 */
export function awaitCandidates(sent, me, now) {
  const seen = new Set()
  const out = []
  for (const m of sent) {
    if (!m?.conversationId || seen.has(m.conversationId)) continue
    seen.add(m.conversationId)
    if (String(m["@odata.type"] ?? "").includes("eventMessage")) continue
    const at = new Date(m.sentDateTime ?? 0).getTime()
    if (!at || now - at < AWAIT_MIN_DAYS * DAY_MS || now - at > AWAIT_DAYS * DAY_MS) continue
    const to = (m.toRecipients ?? []).map((r) => r.emailAddress ?? {})
    const all = [...to, ...(m.ccRecipients ?? []).map((r) => r.emailAddress ?? {})]
    const others = to.filter((r) => r.address && !me.has(lower(r.address)))
    if (!others.length || all.length > MAX_RECIPIENTS) continue
    out.push({
      id: m.id,
      conversationId: m.conversationId,
      subject: m.subject || "",
      to: others.map((r) => r.name || r.address),
      sent: new Date(at),
      webLink: m.webLink ?? null,
    })
  }
  return out
}

/** Konuşmada gönderimden sonra başkasından gelen bir posta var mı (yanıtlanmış). */
export function hasReply(thread, sentAt, me) {
  return thread.some(
    (m) =>
      new Date(m.receivedDateTime ?? 0).getTime() > sentAt.getTime() &&
      m.from?.emailAddress?.address &&
      !me.has(lower(m.from.emailAddress.address)),
  )
}

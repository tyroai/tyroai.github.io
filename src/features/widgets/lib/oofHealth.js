import { STATUS, graphPost } from "@/lib/graph"
import { VOID_STATUSES } from "@/lib/selfServiceStatus"

/** Outlook'un otomatik yanıt ayarı: kapatmak Outlook'ta (yazma izni istemiyoruz). */
export const OOF_SETTINGS_URL = "https://outlook.office.com/mail/options/mail/automaticReplies"
/** Kendi otomatik yanıtın en çok altı saatte bir sorulur (Anasayfa açılınca). */
export const OOF_TTL = 6 * 3_600_000

// Graph saatleri bölgesiz gelir ve UTC'dir (`Prefer: outlook.timezone` gönderilmiyor).
const graphTime = (v) => {
  if (!v?.dateTime) return null
  const ms = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(v.dateTime) ? v.dateTime : `${v.dateTime}Z`)
  return Number.isNaN(ms) ? null : ms
}

/**
 * Kendi otomatik yanıtın açık mı (`getMailTips`, `Mail.Read` — ekip kartının aynı çağrısı):
 * `{ on, end }` — `end`: zamanlanmışsa bitişi (ms).
 */
export async function fetchOwnOof(instance, account) {
  const address = account?.username
  if (!address) return { status: STATUS.error }
  const res = await graphPost(instance, account, {
    path: "/me/getMailTips",
    scopes: ["Mail.Read"],
    body: { EmailAddresses: [address], MailTipsOptions: "automaticReplies" },
  })
  if (res.status !== STATUS.ready) return { status: res.status }
  const tip = res.data?.value?.[0]?.automaticReplies ?? {}
  return {
    status: STATUS.ready,
    data: { on: Boolean(String(tip.message ?? "").trim()), end: graphTime(tip.scheduledEndTime) },
  }
}

const dayStart = (d) => new Date(new Date(d).setHours(0, 0, 0, 0)).getTime()

/** Bugün ERP'de (onaylı ya da onayda) iznin var mı; ERP okunmadıysa `null` (bilmiyoruz). */
export function onLeaveToday(leaves, now) {
  if (!Array.isArray(leaves)) return null
  const today = dayStart(now)
  return leaves.some(
    (l) =>
      l?.start &&
      !VOID_STATUSES.includes(l.statusKind) &&
      dayStart(l.start) <= today &&
      today <= dayStart(l.end ?? l.start),
  )
}

/**
 * "Otomatik yanıtın hâlâ açık" hatırlatması gösterilsin mi: açık AMA bitişi yok (süresiz) ya da
 * geçmiş, ve bugün ERP'de iznin görünmüyor (`onLeave`: `onLeaveToday`; `null` = bilinmiyor →
 * hatırlatılır). Zamanlanmış ve süren otomatik yanıt bilinçlidir (izin, seyahat): susulur.
 */
export function oofReminder(oof, onLeave, now) {
  if (!oof?.on) return false
  if (oof.end != null && oof.end > now) return false
  return onLeave !== true
}

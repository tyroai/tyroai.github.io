import { buildAlerts } from "@/lib/selfServiceAlerts"

const DATA_OF = { leave: "leaves", expense: "expenses", advance: "advances" }
// İş bekleyen uyarılar, önem sırasıyla (Self Servis'in çip sırası).
const ACTION_ALERTS = ["returned", "unsubmitted", "unsettledAdvance"]

/**
 * Taleplerim kartının satırları (saf, testli), önem sırasıyla; her satırın TEK eylemi var:
 * iade edilen kayıt (aç) · gönderilmemiş masraf raporu (TYRO ile gönder) · kapatılmamış iş avansı
 * (TYRO'ya sor) · yarım kalan form taslağı (devam et) · onaydaki talepler, en yenisi önce (aç) ·
 * Kasım–Aralık'ta yıl sonuna kalan izin (izin planla). Uyarılar Self Servis'in kuralları
 * (`buildAlerts`); orada bu oturum kapatılan uyarı (`dismissed`) burada da çıkmaz. Sıradaki izin
 * İzin bakiyem kartında, burada değil.
 *
 * Satır `{ key, type, … }`: uyarıda `alert`, taslakta `kind` + `at`, onaydakinde `kind` + `record`.
 * `drafts`: `[{ kind, at }]` (`lib/requestDrafts`).
 */
export function requestItems(data, { now = new Date(), dismissed = [], drafts = [] } = {}) {
  if (!data) return []
  const alerts = Object.fromEntries(buildAlerts(data, { now, dismissed }).map((a) => [a.id, a]))
  const out = []
  for (const id of ACTION_ALERTS) if (alerts[id]) out.push({ key: id, type: id, alert: alerts[id] })
  for (const { kind, at } of drafts) out.push({ key: `draft:${kind}`, type: "draft", kind, at })
  const pending = Object.entries(DATA_OF)
    .flatMap(([kind, list]) =>
      (data[list] ?? []).filter((r) => r.statusKind === "pending").map((r) => ({ kind, r })),
    )
    .sort((a, b) => (b.r.date?.getTime() ?? 0) - (a.r.date?.getTime() ?? 0))
  for (const { kind, r } of pending)
    out.push({ key: `pending:${kind}:${r.id}`, type: "pending", kind, record: r })
  if (alerts.yearEnd) out.push({ key: "yearEnd", type: "yearEnd", alert: alerts.yearEnd })
  return out
}

/**
 * Satırın gideceği yer: tek kayıtsa kaydın ayrıntısı, birden çoksa listesi o durumla süzülü;
 * taslakta ve yıl sonunda yeni talep formu (`?new=`, taslak varsa onunla açılır).
 */
export function requestTarget(item) {
  if (item.type === "draft") return `/self-service?new=${item.kind}`
  if (item.type === "yearEnd") return "/self-service?new=leave"
  const records = item.record ? [item.record] : (item.alert?.records ?? [])
  const [first] = records
  if (!first) return "/self-service"
  if (records.length === 1)
    return `/self-service?tab=${first.kind}&ref=${encodeURIComponent(first.id)}`
  return `/self-service?tab=${first.kind}&status=${first.statusKind}`
}

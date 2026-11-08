import type { Bucket, SourceKey, TicketList, TicketRow } from "./tibotApi"

/**
 * Tibot Talepler'in saf mantığı (testli): kova (açtıklarım · bana atanan · ekibim), durum tonu,
 * gecikme, Xurrent bağlantısı ve not metninin sadeleştirilmesi.
 */

export type BucketId = "assigned" | "mine" | "team"
// Sıra = çiplerin ve kartların sırası: bana atanan · tarafımdan açılanlar · ekibim.
export const BUCKETS: BucketId[] = ["assigned", "mine", "team"]

export interface BucketView {
  id: BucketId
  /** Xurrent'teki toplam (yüklenen sayfalar daha az olabilir).*/
  count: number
  items: TicketRow[]
  overdue: number
  /** Xurrent'te yüklenmemiş talep var. */
  truncated: boolean
  /** Sonraki sayfası olan kaynaklar ve imleçleri (boşsa "Daha fazla" yok). */
  more: { key: SourceKey; after: string }[]
}

const XURRENT = "https://tyrotech-bt.xurrent.example"

const time = (iso?: string | null): number => {
  const ms = iso ? Date.parse(iso) : NaN
  return Number.isNaN(ms) ? 0 : ms
}

/** Hedef tarih geçti mi: Xurrent tarih yerine "best_effort", "clock_stop" de yazabilir. */
export function isOverdue(row: TicketRow, now: number = Date.now()): boolean {
  if (row.status === "waiting_for_customer") return false
  const at = time(row.nextTargetAt) || time(row.resolutionTargetAt)
  return at > 0 && at < now
}

/** Hedefin anlamlı yazılabilir hâli: tarih ya da `null` ("best_effort", "clock_stop"…). */
export const targetDate = (row: TicketRow): string | null =>
  time(row.nextTargetAt) ? (row.nextTargetAt as string) : null

const byUpdated = (a: TicketRow, b: TicketRow) => time(b.updatedAt) - time(a.updatedAt)

/** Kova başına en çok bu kadar talep yüklenir (10 sayfa); fazlası Xurrent'te. */
export const MAX_ITEMS = 500

/** Kovanın akıştaki kaynakları: açtıklarım iki sorgudan (açtığım + adıma açılan). */
export const SOURCES: Record<BucketId, SourceKey[]> = {
  mine: ["by", "for"],
  assigned: ["assigned"],
  team: ["team"],
}

/** Ek sayfalar: kaynak başına sırayla gelen sonraki 50'ler. */
export type Pages = Partial<Record<SourceKey, Bucket[]>>

function merge(sources: Bucket[][]) {
  const seen = new Map<string, TicketRow>()
  let total = 0
  const more: { key: number; after: string }[] = []
  sources.forEach((chain, i) => {
    total += chain[0]?.totalCount ?? 0
    for (const page of chain)
      for (const r of page?.nodes ?? []) if (!seen.has(r.requestId)) seen.set(r.requestId, r)
    const last = chain[chain.length - 1]?.pageInfo
    if (last?.hasNextPage && last.endCursor) more.push({ key: i, after: last.endCursor })
  })
  const items = [...seen.values()].sort(byUpdated)
  // Hepsi geldiyse gerçek sayı birleşimdir (açtığım ∩ adıma açılan tekrar etmez); değilse toplamlar.
  return { items, total: more.length ? Math.max(items.length, total) : items.length, more }
}

/** Akışın listesi (+ yüklenen ek sayfalar) → üç kova. `mine`: kişinin açtığı ya da onun adına açılan. */
export function buckets(
  list: TicketList | null | undefined,
  now: number = Date.now(),
  pages: Pages = {},
): BucketView[] {
  return BUCKETS.map((id) => {
    const keys = SOURCES[id]
    const chains = keys.map((k) => [list?.[k], ...(pages[k] ?? [])].filter(Boolean) as Bucket[])
    const { items, total, more } = merge(chains)
    const capped = items.length >= MAX_ITEMS
    return {
      id,
      count: total,
      items,
      overdue: items.filter((r) => isOverdue(r, now)).length,
      truncated: more.length > 0,
      // Kişi "Daha fazla"ya basınca istenecek sayfalar; sınıra varınca yok (tümü Xurrent'te).
      more: capped ? [] : more.map((m) => ({ key: keys[m.key], after: m.after })),
    }
  })
}

/** Açılışta seçili kova: işi olan ilk kova (atanan → ekibim → açtıklarım). */
export function defaultBucket(views: BucketView[]): BucketId {
  return views.find((v) => v.count > 0)?.id ?? "mine"
}

export type Tone = "warning" | "info" | "success" | "neutral" | "danger"

/** Durum → ton. Bilinmeyen durum nötr; adı `tibot.status.<durum>` (yoksa ham değer). */
export function statusTone(status: string): Tone {
  switch (status) {
    case "waiting_for_customer":
    case "unclaimed":
      return "warning"
    case "in_progress":
    case "accepted":
      return "info"
    case "completed":
      return "success"
    case "declined":
      return "danger"
    default:
      return "neutral"
  }
}

export const KNOWN_STATUS = [
  "declined",
  "on_backlog",
  "assigned",
  "unclaimed",
  "accepted",
  "in_progress",
  "waiting_for",
  "waiting_for_customer",
  "workflow_pending",
  "completed",
]

/** Xurrent'te talebin adresi: uzmana talep ekranı, talep edene self servis ekranı. */
export function ticketUrl(id: string, staff: boolean): string {
  return `${XURRENT}${staff ? "" : "/self-service"}/requests/${encodeURIComponent(id)}`
}

/** Bütün listesi Xurrent'te (kovanın kendi görünümü). */
export function bucketUrl(id: BucketId): string {
  return id === "mine" ? `${XURRENT}/self-service/requests` : `${XURRENT}/inbox`
}

/** Nottaki görsel işareti: `![](anahtar){:size="1318x425" …}`; anahtar ekin `key`'i. */
export type NoteImageRef = { key: string; w?: number; h?: number }

/**
 * Not metni → okunur düz metin: `<@123|Ad>` → `@Ad`, Markdown görsel metinden çıkar (`refs`,
 * sırayla; boyut biliniyorsa yer önceden ayrılsın), `[metin](adres)` → metin (adres metinle
 * aynıysa tek), fazla boş satır teke.
 */
export function noteText(raw: string): { text: string; images: number; refs: NoteImageRef[] } {
  const refs: NoteImageRef[] = []
  const text = String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/!\[[^\]]*\]\(([^)]*)\)(\{[^}]*\})?/g, (_, key: string, attrs?: string) => {
      const size = /(?:^|[\s{:])size="(\d+)x(\d+)"/.exec(attrs ?? "")
      refs.push(size ? { key: key.trim(), w: +size[1], h: +size[2] } : { key: key.trim() })
      return ""
    })
    .replace(/<@\d+\|([^>]+)>/g, "@$1")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_, label: string, url: string) =>
      label === url ? url : `${label} (${url})`,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return { text, images: refs.length, refs }
}

/** Metindeki adresler (bağlantıya çevrilmek üzere): `[parça, adres mi]`. */
export function splitLinks(text: string): [string, boolean][] {
  const out: [string, boolean][] = []
  const re = /https?:\/\/[^\s)]+/g
  let last = 0
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0
    if (at > last) out.push([text.slice(last, at), false])
    out.push([m[0], true])
    last = at + m[0].length
  }
  if (last < text.length) out.push([text.slice(last), false])
  return out
}

/** Arama: konu, numara, ekip ve kişiler (büyük/küçük harf ve Türkçe harf duyarsız). */
export function matches(row: TicketRow, query: string): boolean {
  const q = fold(query)
  if (!q) return true
  const hay = fold(
    [
      row.requestId,
      row.subject,
      row.team?.name,
      row.member?.name,
      row.requestedFor?.name,
      row.requestedBy?.name,
      row.serviceInstance?.name,
    ]
      .filter(Boolean)
      .join(" "),
  )
  return q.split(/\s+/).every((w) => hay.includes(w))
}

function fold(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .trim()
}

/**
 * Kimin adı: kendi açtığın talepte işi kimin yaptığı (atanan, yoksa ekip); sana ya da ekibine
 * gelen talepte kimin istediği.
 */
export function counterpart(row: TicketRow, bucket: BucketId): string {
  if (bucket === "mine") return row.member?.name ?? row.team?.name ?? ""
  return row.requestedFor?.name ?? row.requestedBy?.name ?? ""
}

/**
 * Satırın gösterilen durumu: ekibe atanmış ama kimse üstlenmemişse "unclaimed" (Xurrent'te ikisi de
 * `assigned`). Süzgeç ve ton bu anahtarla.
 */
export function statusKey(row: Pick<TicketRow, "status" | "member">): string {
  return row.status === "assigned" && !row.member ? "unclaimed" : row.status
}

/**
 * Durumun adı (`statusKey`): "müşteriden yanıt bekleniyor" bakış açısına göre — kendi açtığın
 * talepte (`mine`) "Senden", ekibine ya da sana gelen talepte "Talep sahibinden". Bilinmeyen
 * durum Xurrent'in ham değeri.
 */
export function statusLabel(t: (key: string) => string, key: string, mine = false): string {
  if (key === "waiting_for_customer")
    return t(mine ? "tibot.status.waiting_for_you" : "tibot.status.waiting_for_customer")
  return KNOWN_STATUS.includes(key) ? t(`tibot.status.${key}`) : key
}

/** Talebin servisi (filtre ve satır): servisin adı, yoksa servis örneğinin. */
export const serviceOf = (row: TicketRow): string =>
  row.serviceInstance?.service?.name ?? row.serviceInstance?.name ?? ""

/** Açılış ayı anahtarı: "2026-09" (yerel saat). */
export function monthKey(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export interface TicketFilters {
  status?: string | null
  service?: string | null
  month?: string | null
  member?: string | null
  query?: string
}

/** Atanan süzgecinde "kimse üstlenmemiş" seçeneğinin anahtarı (gerçek bir adla çakışmaz). */
export const NO_MEMBER = "__unassigned"

const FILTER_KEYS = ["status", "service", "month", "member"] as const
type FilterKey = (typeof FILTER_KEYS)[number]
const valueOf: Record<FilterKey, (r: TicketRow) => string> = {
  status: statusKey,
  service: serviceOf,
  month: (r) => monthKey(r.createdAt),
  member: (r) => r.member?.name?.trim() || NO_MEMBER,
}

/** Bir süzgeç ya da arama seçili mi (Temizle düğmesi ve "eşleşen yok" metni). */
export const hasFilters = (f: TicketFilters): boolean =>
  Boolean(f.query || FILTER_KEYS.some((k) => f[k]))

/** Süzgeçlere ve aramaya uyanlar (`skip`: seçeneklerin sayısı hesaplanırken o süzgeç yok sayılır). */
export function filterRows(items: TicketRow[], f: TicketFilters, skip?: FilterKey): TicketRow[] {
  return items.filter(
    (r) =>
      FILTER_KEYS.every((k) => k === skip || !f[k] || valueOf[k](r) === f[k]) &&
      matches(r, f.query ?? ""),
  )
}

/**
 * Bir süzgecin seçenekleri `{ key, count }` — öteki süzgeçlere ve aramaya uyanlardan sayılır
 * (Self Servis'in kuralı: sayı, seçince göreceğin satır sayısıdır). Ay en yeniden, ötekiler çoktan aza.
 */
export function facetOptions(items: TicketRow[], f: TicketFilters, key: FilterKey) {
  const counts = new Map<string, number>()
  for (const r of filterRows(items, f, key)) {
    const v = valueOf[key](r)
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  const list = [...counts].map(([k, count]) => ({ key: k, count }))
  return key === "month"
    ? list.sort((a, b) => b.key.localeCompare(a.key))
    : list.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

/** Açılış ayına göre gruplar, en yeni ay ve en yeni talep üstte (Self Servis listesinin düzeni). */
export function groupByMonth(items: TicketRow[]): { key: string; items: TicketRow[] }[] {
  const sorted = [...items].sort((a, b) => time(b.createdAt) - time(a.createdAt))
  const groups: { key: string; items: TicketRow[] }[] = []
  for (const r of sorted) {
    const k = monthKey(r.createdAt)
    const last = groups[groups.length - 1]
    if (last?.key === k) last.items.push(r)
    else groups.push({ key: k, items: [r] })
  }
  return groups
}

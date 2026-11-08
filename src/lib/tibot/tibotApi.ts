import "@/lib/i18n/tibot"
import { msalInstance } from "@/lib/msal"
import { createSessionCache, onSessionClear } from "@/lib/sessionCache"
import { buckets } from "./tibotModel"
import { setTibotPeek } from "./tibotPeek"

/**
 * Tibot Talepler'in veri hattı: Power Automate akışı `tyroXurrentTickets` (TYRO ortamı). Akış
 * yalnız TYRO jetonuyla çağrılır (tetikleyici "kiracımdaki kullanıcılar"); kişiyi Power
 * Platform'un jetondan yazdığı `x-ms-user-email`den tanır — tarayıcı başkası adına soramaz.
 * Xurrent anahtarı akışta, tarayıcıya hiç gelmez. Adres sır değil (jetonsuz çağrı 401).
 *
 * Üç işlem: `list` (açtıklarım · bana atanan · ekibim, her biri en yeni 50 + imleç), `more` (bir
 * kovanın sonraki 50'si — yalnız kişi "Daha fazla"ya basınca) ve `detail` (tek talep + notlar; akış
 * kişinin o talebi görebildiğini kendisi denetler, göremiyorsa 404). Süzgeç akışta: tarayıcı
 * yalnız kova adını ve imleci verir. Yeniden deneme yok (akışta da): her istek kişinin bir eylemi.
 * Liste açılışta ve "Yenile"de gider; arada 5 dakika bellekte, çıkışta silinir.
 */
const FLOW_URL =
  import.meta.env.VITE_TIBOT_FLOW_URL ||
  "https://dadecf72cb27e170b32f0b35fa90c9.55.environment.api.powerplatform.com/powerautomate/automations/direct/cu/13/workflows/3de3053f5e7042098be235f6e27ddaf2/triggers/manual/paths/invoke?api-version=1"

/** Akışın tetikleyicisinin istediği hedef (sondaki çift eğik çizgi dahil — Microsoft Flow Service). */
export const tibotRequest = { scopes: ["https://service.flow.microsoft.com//User"] }

const TTL = 5 * 60 * 1000

export interface Person {
  name: string
}
export interface TicketRow {
  requestId: string
  subject: string
  status: string
  category?: string | null
  impact?: string | null
  createdAt: string
  updatedAt: string
  nextTargetAt?: string | null
  resolutionTargetAt?: string | null
  completedAt?: string | null
  team?: { id: string; name: string } | null
  member?: { id: string; name: string } | null
  requestedBy?: { id?: string; name: string } | null
  requestedFor?: { id?: string; name: string } | null
  serviceInstance?: { name: string; service?: { name: string } | null } | null
}
export interface Bucket {
  totalCount: number
  nodes: TicketRow[]
  /** Xurrent'in imleci: sonraki 50 (`loadMorePage`). */
  pageInfo?: { hasNextPage: boolean; endCursor: string | null }
}
/** Akışın kova adları (açtıklarım iki kaynaktan: açtığım + adıma açılan). */
export type SourceKey = "by" | "for" | "assigned" | "team"
export interface TicketList {
  /** Xurrent'te kaydı olmayan kişide `null`: widget ve sekme sessizce boş durumunu çizer. */
  person: { id: number; name: string } | null
  teams?: string[]
  by?: Bucket
  for?: Bucket
  assigned?: Bucket
  team?: Bucket
}
export interface TicketNote {
  id: string
  text: string
  createdAt: string
  internal: boolean
  person?: Person | null
}
export interface TicketDetail {
  /** Kişi talebin ekibinde ya da atananı mı (iç notlar ve uzman bağlantısı). */
  staff: boolean
  request: TicketRow
  notes: TicketNote[]
}

export type TibotErrorKind = "denied" | "notFound" | "error"
export class TibotError extends Error {
  kind: TibotErrorKind
  constructor(kind: TibotErrorKind, detail?: string) {
    super(detail || kind)
    this.kind = kind
  }
}

async function token(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  if (!account) throw new TibotError("denied", "no account")
  try {
    return (await msalInstance.acquireTokenSilent({ ...tibotRequest, account })).accessToken
  } catch (err) {
    // Sessiz ya da hiç (onay penceresi açılmaz): izin yoksa widget "erişim yok" der.
    throw new TibotError("denied", (err as { errorCode?: string })?.errorCode ?? "token")
  }
}

// Akışın kendi süre sınırı istek başına 25 sn; tarayıcı en çok 45 sn bekler, sonra vazgeçer.
const TIMEOUT_MS = 45_000

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const auth = await token()
  let res: Response
  try {
    res = await fetch(FLOW_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    throw new TibotError("error", (err as Error)?.name ?? "network")
  }
  if (res.status === 401 || res.status === 403) throw new TibotError("denied", `HTTP ${res.status}`)
  if (res.status === 404) throw new TibotError("notFound")
  if (!res.ok) throw new TibotError("error", `HTTP ${res.status}`)
  return (await res.json()) as T
}

/** Listeden bağımlılıksız özet (`tibotPeek`). */
function peekOf(list: TicketList) {
  const views = Object.fromEntries(buckets(list).map((v) => [v.id, v]))
  return {
    assigned: views.assigned.count,
    late: views.assigned.overdue,
    waiting: views.mine.count,
    needsMe: views.mine.items.filter((r) => r.status === "waiting_for_customer").length,
  }
}

const lists = createSessionCache<string, TicketList>({
  ttlMs: TTL,
  maxEntries: 1,
  name: "tibotList",
})
const details = createSessionCache<string, TicketDetail>({
  ttlMs: TTL,
  maxEntries: 30,
  name: "tibotDetail",
})

/** Bellekteki liste (süresi geçmiş olsa da — ilk çizim için). */
export const peekTickets = (): TicketList | undefined => lists.get("me", { stale: true })
export const ticketsFresh = (): boolean => lists.has("me")

/** Liste: taze ise bellekten; `force` (Yenile) akışa sorar. Aynı anda iki istek tek uçuşa iner. */
export function loadTickets({ force = false } = {}): Promise<TicketList> {
  const hit = force ? undefined : lists.get("me")
  if (hit) return Promise.resolve(hit)
  return lists.dedupe("me", async (commit) => {
    const value = await call<TicketList>({ op: "list" })
    // Header yüzü, çentik, brifing ve karşılama: bende bekleyen ve beklediğim sayıları.
    if (commit(value)) setTibotPeek(value.person ? peekOf(value) : null)
    return value
  })
}

/** Bir kovanın sonraki sayfası (önbelleğe girmez: "Yenile" ilk sayfadan başlar). */
export async function loadMorePage(key: SourceKey, after: string): Promise<Bucket> {
  const { page } = await call<{ page: Bucket | null }>({ op: "more", bucket: key, after })
  if (!page) throw new TibotError("error", "empty page")
  return page
}

/** Seçili yılın sayıları (Self Servis özet kartı): kapattığım, bana atanan, açtığım, açtığımdan kapanan. */
export interface TibotYear {
  closed: number
  assigned: number
  opened: number
  openedClosed: number
  /** Ekiplerimde kapanan ve gelen (Tempo › Ekip); eski akış cevabında yok. */
  teamClosed?: number
  teamAssigned?: number
}
const years = createSessionCache<string, TibotYear>({
  ttlMs: TTL,
  maxEntries: 6,
  name: "tibotYear",
})

export const peekYear = (year: number | null): TibotYear | undefined =>
  years.get(String(year ?? "all"), { stale: true })

/** Yılın sayıları (`null` = tüm yıllar); 5 dk bellek, aynı anda tek istek. */
export function loadYear(year: number | null): Promise<TibotYear> {
  const key = String(year ?? "all")
  const hit = years.get(key)
  if (hit) return Promise.resolve(hit)
  return years.dedupe(key, async (commit) => {
    const value = await call<TibotYear>({ op: "year", ...(year ? { year } : {}) })
    commit(value)
    return value
  })
}

export const peekTicket = (id: string): TicketDetail | undefined => details.get(id, { stale: true })

/** Tek talep + notlar. Liste yenilenince detaylar da tazelenir (`force`). */
export function loadTicket(id: string, { force = false } = {}): Promise<TicketDetail> {
  const key = String(id)
  const hit = force ? undefined : details.get(key)
  if (hit) return Promise.resolve(hit)
  return details.dedupe(key, async (commit) => {
    const value = await call<TicketDetail>({ op: "detail", id: key })
    commit(value)
    return value
  })
}

/** Yenile: liste ve açılmış detayların hepsi bir sonraki okumada akıştan gelsin. */
export function forgetTickets(): void {
  lists.delete("me")
  details.clear()
  years.clear()
}

// Çıkışta tepsinin sayısı da düşer.
onSessionClear(() => setTibotPeek(null), "tibotPeek")

// Açık listeler (widget, Self Servis sekmesi): ortak "Yenile" onlara haber verir.
const refreshers = new Set<() => Promise<unknown>>()

/** Ekrandaki liste kendini kaydeder; dönen işlev kaydı siler. */
export function onTicketsRefresh(fn: () => Promise<unknown>): () => void {
  refreshers.add(fn)
  return () => {
    refreshers.delete(fn)
  }
}

/**
 * Ortak "Yenile" (Self Servis'in özet kartındaki düğme de çağırır): bellek boşalır; açık bir liste
 * varsa YALNIZ o akışa yeniden sorar (aynı anda tek istek: liste önbelleği uçuştakini paylaşır).
 * Ekranda Tibot yoksa istek gitmez — sekme açılınca taze okur.
 */
export function refreshTickets(): Promise<void> {
  forgetTickets()
  return Promise.all([...refreshers].map((fn) => fn())).then(() => undefined)
}

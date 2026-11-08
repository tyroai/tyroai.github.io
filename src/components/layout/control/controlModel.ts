/**
 * Denetim Merkezi'nin kutucukları (saf, testli): hangileri, hangi sırada, hangi boyda.
 * Kutucuk ya yerleşik (aç-kapa `toggle:*` — Odak, Sunum, koyu görünüm, çentik; araç `tool:*` —
 * hızlı görev, kısayollar) ya da header'a girebilen bir widget (kendi kimliğiyle; yüzü ve
 * penceresi header'dakinin aynısı). Kayıt yalnız kimlik listesi; kişi hiç düzenlemediyse kayıt
 * yok, varsayılan geçerli.
 */
export const TOGGLES = ["toggle:focus", "toggle:present", "toggle:theme", "toggle:notch"] as const
export const TOOLS = ["tool:task", "tool:presence", "tool:oof", "tool:shortcuts"] as const
export const BUILTINS: readonly string[] = [...TOGGLES, ...TOOLS]
export type ToggleId = (typeof TOGGLES)[number]

/** Kısayollar şeridi hep en altta: kayıttaki yeri ne olursa olsun en sona çizilir. */
export const PINNED_LAST = "tool:shortcuts"

/**
 * Varsayılan sıra: üstte modlar ve Tyrofy, sonra Piyasa, sayaç, saat, döviz çevirici ve Çevir;
 * notlar ve tema küçük;
 * hızlı görev ve çentik (Tibot açıksa yanında); en altta tam genişlikte kısayollar. Tibot'suz
 * altı satır boşluksuz.
 */
export const DEFAULT_TILES: readonly string[] = [
  "toggle:focus",
  "radio",
  "toggle:present",
  "market",
  "focus-timer",
  "world-clock",
  "tyro-fx",
  "tyro-translate",
  "sticky",
  "toggle:theme",
  "tool:task",
  "toggle:notch",
  "tool:presence",
  "tool:oof",
  "tibot-rings",
  PINNED_LAST,
]

/** Panelde en çok bu kadar kutucuk (ekleme listesi bunun üstüne çıkarmaz). */
export const CONTROL_MAX = 16

type Pred = (id: string) => boolean

export const isBuiltin = (id: string): boolean => BUILTINS.includes(id)
export const isToggle = (id: string): id is ToggleId => (TOGGLES as readonly string[]).includes(id)

/**
 * Varsayılan boy: Tyrofy iki satır (şimdi çalıyor), kısayollar tam genişlik, notlar ve tema
 * tek hücre, ötekiler iki hücre.
 */
export type TileSize = "large" | "full" | "wide" | "small"
const SMALL = new Set(["sticky", "toggle:theme"])
export const tileSize = (id: string): TileSize =>
  id === "radio" ? "large" : id === "tool:shortcuts" ? "full" : SMALL.has(id) ? "small" : "wide"

/**
 * Seçilebilen boylar (macOS'ta sağ tık › Küçük · Orta · Büyük): kutucukların çoğu küçük (yalnız
 * simge) ve orta. Büyüğü yalnız büyük yüzü olan: Tyrofy (plaklı disk; ortası yatay disk,
 * küçüğü yok — disk sığmaz). Kısayollar hep tam genişlik.
 */
export function sizeOptions(id: string): TileSize[] {
  if (id === PINNED_LAST) return ["full"]
  if (id === "radio") return ["wide", "large"]
  return ["small", "wide"]
}

/** Kutucuğun boyu: kişinin seçtiği (geçerliyse) ya da varsayılan. */
export const sizeOf = (id: string, sizes: Record<string, string> | null | undefined): TileSize => {
  const want = sizes?.[id] as TileSize | undefined
  return want && sizeOptions(id).includes(want) ? want : tileSize(id)
}

/** Kayıttaki boylar temizlenir: tanınmayan kutucuk, geçersiz boy ve varsayılanla aynı olan düşer. */
export function sanitizeSizes(
  raw: unknown,
  known: (id: string) => boolean,
): Record<string, TileSize> {
  const out: Record<string, TileSize> = {}
  if (!raw || typeof raw !== "object") return out
  for (const [id, size] of Object.entries(raw as Record<string, unknown>)) {
    if (!known(id) || typeof size !== "string") continue
    const s = size as TileSize
    if (sizeOptions(id).includes(s) && s !== tileSize(id)) out[id] = s
  }
  return out
}

/**
 * Sıra: `id`yi `to` sırasına taşır (sınırlara kırpılır); liste değişmediyse aynı dizi.
 * Kısayollar taşınmaz ve hep sonda kalır: öteki kutucuk onun altına geçemez.
 */
export function moveTile(list: readonly string[], id: string, to: number): readonly string[] {
  const from = list.indexOf(id)
  if (from < 0 || id === PINNED_LAST) return list
  const last = list.length - (list.includes(PINNED_LAST) ? 2 : 1)
  const at = Math.max(0, Math.min(last, to))
  if (at === from) return list
  const next = list.filter((x) => x !== id)
  next.splice(at, 0, id)
  return next
}

/**
 * Kayıt temizlenir: tanınmayan (ne yerleşik ne header'a girebilen widget), yinelenen ve fazlası
 * düşer. Dizi değilse `null` (kayıt yok → varsayılan).
 */
export function sanitizeTiles(
  raw: unknown,
  eligible: Pred,
  alias: (id: string) => string = (x) => x,
) {
  if (!Array.isArray(raw)) return null
  const out: string[] = []
  for (const x of raw) {
    if (out.length === CONTROL_MAX) break
    const id = typeof x === "string" ? alias(x) : null
    if (id && !out.includes(id) && (isBuiltin(id) || eligible(id))) out.push(id)
  }
  return out
}

const pinLast = (list: readonly string[]): string[] =>
  list.includes(PINNED_LAST) ? [...list.filter((x) => x !== PINNED_LAST), PINNED_LAST] : [...list]

// Sürüm yükseltmesinde bir kez eklenenler (sonra çıkarılırsa yeni sürümün kaydında çıkık kalır).
const ADDED_IN: [number, string[]][] = [
  [2, [PINNED_LAST]],
  [3, ["tool:presence", "tool:oof"]],
  [4, ["tyro-fx", "tyro-translate"]],
]

/**
 * Kayıt sürümü yükseltmesi: v2 kısayolları, v3 Teams durumunu ve otomatik yanıtı, v4 döviz
 * çeviriciyi ve Çevir'i varsayılan yaptı; eski kayıtta yoksa bir kez eklenir (kısayolların önüne —
 * o hep sonda). Panel doluysa sığan kadarı: fazlası kısayolları listeden atardı.
 */
export function upgradeTiles(raw: unknown, version: number): unknown {
  if (!Array.isArray(raw)) return raw
  let list = [...raw]
  for (const [v, ids] of ADDED_IN) {
    if (version >= v) continue
    const room = CONTROL_MAX - list.length
    const missing = ids.filter((id) => !list.includes(id)).slice(0, Math.max(0, room))
    if (!missing.length) continue
    const at = list.indexOf(PINNED_LAST)
    list = at < 0 ? [...list, ...missing] : [...list.slice(0, at), ...missing, ...list.slice(at)]
  }
  return list
}

/** Görünen kutucuklar: kayıt (yoksa varsayılan), yalnız bu kişiye açık widget'lar; kısayollar sonda. */
export function visibleTiles(saved: readonly string[] | null, available: Pred): string[] {
  return pinLast((saved ?? DEFAULT_TILES).filter((id) => isBuiltin(id) || available(id)))
}

/**
 * Eklenebilecekler: panelde olmayan yerleşikler ve bu kişiye açık widget'lar — önce yerleşikler,
 * sonra `candidates` sırası (header'ın önerdikleri önde). Panel doluysa boş.
 */
export function addableTiles(
  current: readonly string[],
  candidates: readonly string[],
  available: Pred,
) {
  if (current.length >= CONTROL_MAX) return []
  const seen = new Set(current)
  return [...BUILTINS, ...candidates].filter((id) => {
    if (seen.has(id)) return false
    seen.add(id)
    return isBuiltin(id) || available(id)
  })
}

/** Eklenen kutucuk sona, kısayolların üstüne girer. */
export const withTile = (list: readonly string[], id: string): string[] =>
  list.includes(id) || list.length >= CONTROL_MAX ? [...list] : pinLast([...list, id])

export const withoutTile = (list: readonly string[], id: string): string[] =>
  list.filter((x) => x !== id)

// ── Kısayollar: kişinin kendi bağlantıları (ERP, Xurrent portalı …) ────────────────────────

export interface LinkShortcut {
  id: string
  name: string
  url: string
}
export const LINK_MAX = 4
export const LINK_NAME_MAX = 24

/** Yalnız https bağlantısı (javascript:, data:, http: yok); geçerliyse normalize edilmiş adres. */
export function safeLinkUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 500) return null
  try {
    const u = new URL(raw.trim())
    return u.protocol === "https:" && u.hostname.includes(".") ? u.href : null
  } catch {
    return null
  }
}

/** Kayıttaki bağlantılar temizlenir: adı boş, adresi güvensiz, yinelenen ve fazlası düşer. */
export function sanitizeLinks(raw: unknown): LinkShortcut[] {
  if (!Array.isArray(raw)) return []
  const out: LinkShortcut[] = []
  for (const x of raw) {
    if (out.length === LINK_MAX) break
    const r = x as Partial<LinkShortcut> | null
    const name = typeof r?.name === "string" ? r.name.trim().slice(0, LINK_NAME_MAX) : ""
    const url = safeLinkUrl(r?.url)
    const id = typeof r?.id === "string" && /^[a-z0-9]{1,20}$/i.test(r.id) ? r.id : null
    if (name && url && id && !out.some((o) => o.id === id || o.url === url))
      out.push({ id, name, url })
  }
  return out
}

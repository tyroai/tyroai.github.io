/**
 * Çentiğin yuvaları: yan rayda ve telefon şeridinde sırayla en çok üç öğe — yerleşik üçlü (Posta ·
 * Takvim · Saatler) ya da header'a girebilen herhangi bir widget (ör. Tyrofy). Kayıt bu
 * tarayıcıda (`tyro-notch-slots-v1`, yalnız kimlikler — kişisel veri değil). Tanınmayan, iki kez
 * geçen ve fazla kimlik sessizce düşer; geriye bir şey kalmazsa varsayılan. Saf ve testli:
 * widget'ın geçerliliği dışarıdan gelir (`isWidget`), bu dosya widget kayıt defterini bilmez.
 */
export const NOTCH_SLOTS_KEY = "tyro-notch-slots-v1"
export const NOTCH_SLOT_MAX = 3
export const BUILTIN_SLOTS = ["mail", "calendar", "clocks"] as const
export type BuiltinSlot = (typeof BUILTIN_SLOTS)[number]
// Varsayılan üçüncü yuva Yapışkan notlar (ürün sahibinin kararı); Saatler katalogda kalır.
export const DEFAULT_SLOTS: readonly string[] = ["mail", "calendar", "sticky"]

type IsWidget = (id: string) => boolean
/** Eski kimlik → yenisi (birleşen ya da adı değişen kart); verilmezse kimlik aynen. */
type Alias = (id: string) => string

export const isBuiltinSlot = (id: string): id is BuiltinSlot =>
  (BUILTIN_SLOTS as readonly string[]).includes(id)

/** Ham değer → geçerli, tekil, en çok üç kimlik; geriye bir şey kalmazsa varsayılan. */
export function normalizeSlots(raw: unknown, isWidget: IsWidget, alias?: Alias): string[] {
  const out: string[] = []
  for (const x of Array.isArray(raw) ? raw : []) {
    if (out.length === NOTCH_SLOT_MAX) break
    const id = typeof x === "string" && alias ? alias(x) : x
    if (typeof id !== "string" || out.includes(id)) continue
    if (isBuiltinSlot(id) || isWidget(id)) out.push(id)
  }
  return out.length ? out : [...DEFAULT_SLOTS]
}

/** Depodaki metin → yuvalar. Kayıt yoksa ya da bozuksa varsayılan. */
export function parseSlots(text: string | null, isWidget: IsWidget, alias?: Alias): string[] {
  if (text == null) return [...DEFAULT_SLOTS]
  try {
    return normalizeSlots(JSON.parse(text), isWidget, alias)
  } catch {
    return [...DEFAULT_SLOTS]
  }
}

/** Seç / bırak: doluyken eklenmez; son kalan bırakılmaz (ray boş kalmasın). */
export function toggleSlot(items: readonly string[], id: string): string[] {
  if (items.includes(id)) return items.length > 1 ? items.filter((x) => x !== id) : [...items]
  return items.length < NOTCH_SLOT_MAX ? [...items, id] : [...items]
}

/** `id`yi `step` kadar (−1 yukarı, +1 aşağı) taşır; sınırda değişmez. */
export function moveSlot(items: readonly string[], id: string, step: number): string[] {
  const from = items.indexOf(id)
  const to = from + step
  if (from < 0 || to < 0 || to >= items.length) return [...items]
  const next = items.filter((x) => x !== id)
  next.splice(to, 0, id)
  return next
}

export type PlaceResult = "added" | "moved" | "same" | "replaced" | "full"

/**
 * Sürükle-bırak: `id`yi `index`teki yuvaya koyar. Çentikteyse yer değiştirir; değilse araya girer
 * (dizin sondan büyükse sona). Doluyken dolu bir yuvanın ÜSTÜNE bırakılan yeni öğe o yuvadakinin
 * yerine geçer (`replaced`, çıkan `out`; ürün sahibinin kararı); yuva gösterilmeden (sona) eklenen
 * yeni öğe geri çevrilir (`full`): hangi öğenin gideceği belli değil, kimse sessizce düşmez.
 */
export function placeSlot(
  items: readonly string[],
  id: string,
  index: number,
): { items: string[]; result: PlaceResult; out?: string } {
  const at = Math.max(0, Math.min(index, items.length))
  if (items.includes(id)) {
    const from = items.indexOf(id)
    const to = Math.min(at, items.length - 1)
    if (from === to) return { items: [...items], result: "same" }
    const next = items.filter((x) => x !== id)
    next.splice(to, 0, id)
    return { items: next, result: "moved" }
  }
  if (items.length >= NOTCH_SLOT_MAX) {
    if (index >= items.length) return { items: [...items], result: "full" }
    const next = [...items]
    const [out] = next.splice(at, 1, id)
    return { items: next, result: "replaced", out }
  }
  const next = [...items]
  next.splice(at, 0, id)
  return { items: next, result: "added" }
}

import { isValidAmount } from "@/lib/promptTemplates"
import { formErrors } from "@/lib/requestForm"

/**
 * MASRAF IZGARASININ SÜTUNLARI — saf katman (kişinin düzeni `useExpenseColumns`, yerel kayıt).
 *
 * Her sütun bir şablon alanı (`PROMPT_TEMPLATES.expense.slots`). Fiş görselleri sütun değil:
 * ERP'de masrafın başlığına eklenir, kaleme değil. Zorunlu alanlar (`locked`) hep ızgarada:
 * gizlenirse doldurulamaz. Izgarada olmayan isteğe bağlı alanlar kalemin "Ayrıntı"sında durur.
 * Yerleşim: # · sütunlar (kişinin sırası) · eylemler. `min`: sütunun en dar hâli (rem) —
 * ızgaranın en dar genişliği bundan hesaplanır.
 */
// Varsayılan düzen çok kalem girişine göre: kategori geniş (adlar uzun) ama artan yeri en çok
// yazılan açıklamayla neredeyse eşit paylaşır; tutar ve para birimi TEK sütun ve hiç daralmaz;
// fiş no, firma, lokasyon ve kişi sayısı "Ayrıntı"da (menüden sütun olur).
export const EXPENSE_COLUMNS = [
  { id: "date", track: "minmax(8.5rem,9.5rem)", min: 8.5, locked: true },
  { id: "category", track: "minmax(12rem,1.15fr)", min: 12, locked: true },
  { id: "note", track: "minmax(10rem,1fr)", min: 10 },
  { id: "receipt", track: "minmax(6.5rem,0.55fr)", min: 6.5, hidden: true },
  { id: "firm", track: "minmax(8rem,0.8fr)", min: 8, hidden: true },
  { id: "location", track: "7.5rem", min: 7.5, hidden: true },
  { id: "people", track: "5.5rem", min: 5.5, hidden: true },
  { id: "amount", track: "12.5rem", min: 12.5, locked: true },
]

const BY_ID = new Map(EXPENSE_COLUMNS.map((c) => [c.id, c]))
const NUMBER_TRACK = 2.5
// Eylem sütunu: dört düğme en az 24 px (kök yazı küçülse de), dokunmatikte 44 px — genişliği
// ızgaranın CSS değişkeni verir (`grid.css`); en dar genişlik hesabı küçülmüş kökü de karşılasın
// diye bol, dokunmatikte o sütunun kendisi.
const ACTIONS_TRACK = 6.75
const ACTIONS_MIN = 8.25
const ACTIONS_COARSE = 12
const GAP = 0.5
const PAD = 1

export const columnOf = (id) => BY_ID.get(id) ?? null
export const isLocked = (id) => Boolean(BY_ID.get(id)?.locked)

/** Varsayılan düzen: tanım sırası, `hidden` olmayanlar görünür. */
export function defaultLayout() {
  return {
    order: EXPENSE_COLUMNS.map((c) => c.id),
    shown: EXPENSE_COLUMNS.filter((c) => !c.hidden).map((c) => c.id),
  }
}

/**
 * Kayıttan gelen düzeni onarır: bilinmeyen sütun düşer (eski kayıtlardaki fiş sütunu `files` da),
 * kayıtta olmayan (sonradan eklenen) sütun varsayılan görünürlüğüyle SONA eklenir, zorunlu sütun
 * hep görünür. Bozuk kayıt → varsayılan.
 */
export function normalizeLayout(raw) {
  const base = defaultLayout()
  if (!raw || !Array.isArray(raw.order) || !Array.isArray(raw.shown)) return base
  const known = raw.order.filter((id, i) => BY_ID.has(id) && raw.order.indexOf(id) === i)
  const added = base.order.filter((id) => !known.includes(id))
  const order = [...known, ...added]
  const shown = new Set(raw.shown.filter((id) => BY_ID.has(id)))
  for (const id of added) if (!BY_ID.get(id).hidden) shown.add(id)
  for (const c of EXPENSE_COLUMNS) if (c.locked) shown.add(c.id)
  return { order, shown: order.filter((id) => shown.has(id)) }
}

/** Görünür sütunların kimlikleri, kişinin sırasıyla. */
export const visibleColumns = (layout) => layout.order.filter((id) => layout.shown.includes(id))

/** Sütunu göster / gizle (zorunlu sütun gizlenmez). */
export function setShown(layout, id, on) {
  if (!BY_ID.has(id) || (isLocked(id) && !on)) return layout
  const set = new Set(layout.shown)
  if (on) set.add(id)
  else set.delete(id)
  return { ...layout, shown: layout.order.filter((x) => set.has(x)) }
}

/** Sütunu sırada `delta` kadar kaydırır (-1 yukarı/sola, +1 aşağı/sağa); uçta değişmez. */
export function moveColumn(layout, id, delta) {
  const at = layout.order.indexOf(id)
  const to = at + delta
  if (at < 0 || to < 0 || to >= layout.order.length) return layout
  const order = [...layout.order]
  order.splice(at, 1)
  order.splice(to, 0, id)
  return { order, shown: order.filter((x) => layout.shown.includes(x)) }
}

/** Sürükle-bırakın verdiği yeni sıra (bilinmeyen ya da eksik liste yok sayılır). */
export function reorderColumns(layout, order) {
  const same = order.length === layout.order.length && order.every((id) => BY_ID.has(id))
  if (!same || new Set(order).size !== order.length) return layout
  return { order: [...order], shown: order.filter((x) => layout.shown.includes(x)) }
}

/** Izgaranın sütun şablonu: # · görünür sütunlar · eylemler (`--xg-actions`, dokunmatikte geniş). */
export function gridTemplate(ids) {
  const tracks = ids.map((id) => BY_ID.get(id)?.track).filter(Boolean)
  return [`${NUMBER_TRACK}rem`, ...tracks, `var(--xg-actions,${ACTIONS_TRACK}rem)`].join(" ")
}

/**
 * Izgaranın en dar genişliği (rem): sütun alt sınırları + aralıklar + satırın iç payı. `coarse`:
 * dokunmatik ekran (eylem düğmeleri 44 px).
 */
export function tableMinRem(ids, coarse = false) {
  const cols = ids.map((id) => BY_ID.get(id)?.min ?? 0)
  const actions = coarse ? ACTIONS_COARSE : ACTIONS_MIN
  const sum = cols.reduce((a, b) => a + b, NUMBER_TRACK + actions)
  return sum + (cols.length + 1) * GAP + PAD
}

/** Sütunun değeri boş mu: tutar geçersizse, seçim yoksa, yazı boşsa. */
export function isColumnEmpty(id, values) {
  const v = values?.[id]
  if (id === "amount" || id === "people") return !isValidAmount(v)
  if (v instanceof Date) return false
  return v == null || String(v).trim() === ""
}

/**
 * Kalemde yazmaya başlanacak sütun: önce boş zorunlu sütun (yeni kalemde tarih ve para birimi
 * önceki kalemden geldiği için çoğunlukla kategori), sonra ilk boş sütun; hepsi doluysa ilk sütun.
 */
export function firstEmptyColumn(ids, values) {
  const empty = ids.filter((id) => isColumnEmpty(id, values))
  return empty.find(isLocked) ?? empty[0] ?? ids[0] ?? null
}

/** Kalemin eksik ya da hatalı alanları (`formErrors`), görünür sütun sırasıyla. */
export function missingFields(ids, values) {
  const names = Object.keys(formErrors("expense", values))
  const rank = (n) => (ids.includes(n) ? ids.indexOf(n) : ids.length)
  return names.sort((a, b) => rank(a) - rank(b))
}

/**
 * Bütün kalemlerde kalan alan sayısı ve ilki (`{ id, name }`: odak oraya). Gönderme denemesinden
 * önce de canlı: kişi neyin eksik olduğunu yazarken görür.
 */
export function expenseProgress(rows, ids = []) {
  let left = 0
  let first = null
  for (const r of rows) {
    const names = missingFields(ids, r.values)
    left += names.length
    if (!first && names.length) first = { id: r.id, name: names[0] }
  }
  return { left, first }
}

/** Silinen kalemden sonra odağın gideceği kalem: sonraki, sonuncuysa önceki. */
export function neighbourOf(ids, id) {
  const at = ids.indexOf(id)
  if (at < 0) return null
  return ids[at + 1] ?? ids[at - 1] ?? null
}

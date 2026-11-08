import { expenseTotals } from "@/lib/requestForm"

/**
 * Talep formunun görünüm mantığı (saf): seçici öğeleri, kategori grupları, masraf özeti ve kalem
 * işlemleri. Alanların kendisi tek kaynaktan, `promptTemplates` şablonlarından gelir.
 */

/** Masraf kategorisinin grubu: başlıktaki "(Yurtiçi)" / "(Yurtdışı)" eki; eki yoksa "other". */
export function categoryGroup(title) {
  const s = String(title ?? "").toLocaleLowerCase("tr")
  if (s.includes("(yurtiçi)")) return "domestic"
  if (s.includes("(yurtdışı)")) return "abroad"
  return "other"
}

const GROUP_ORDER = ["domestic", "abroad", "other"]

/**
 * Seçenekleri gruplara ayırır (`groupOf(option)` → grup anahtarı), grup sırası sabit. Tek grup
 * çıkarsa gruplama yok: düz liste döner (`null`).
 */
export function groupOptions(options, groupOf, order = GROUP_ORDER) {
  const by = new Map()
  for (const o of options) {
    const g = groupOf(o)
    if (!by.has(g)) by.set(g, [])
    by.get(g).push(o)
  }
  if (by.size < 2) return null
  const rank = (g) => (order.includes(g) ? order.indexOf(g) : order.length)
  return [...by.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([key, list]) => ({ key, options: list }))
}

/**
 * Masraf özeti: kalem sayısı ve para birimine göre toplamlar — TRY önce, ötekiler büyükten
 * küçüğe. Gönder düğmesi ve tablonun alt şeridi bunu yazar.
 */
export function expenseSummary(rows, locale) {
  const totals = Object.entries(expenseTotals(rows, locale)).sort(([a, x], [b, y]) =>
    a === "TRY" ? -1 : b === "TRY" ? 1 : y - x || a.localeCompare(b),
  )
  return { count: rows.length, totals }
}

/** Ayrıntı alanlarından dolu olanların sayısı (eklenmiş ve boş olmayan). */
export function filledCount(values, names) {
  return names.filter((n) => values?.[n] !== undefined && String(values[n]).trim() !== "").length
}

/** Listeye `at` konumuna öğe ekler (yeni dizi). */
export const insertAt = (list, at, item) => [...list.slice(0, at), item, ...list.slice(at)]

/** Yeni kalemin değerleri: sonuncunun tarihi ve para birimi (aynı gezinin fişleri çoğunlukla öyle). */
export const carryOver = (fresh, last) => ({
  ...fresh,
  date: last?.date ?? fresh.date,
  currency: last?.currency ?? fresh.currency,
})

/** Ayrıntı alanlarından hatalı olan var mı: masaüstü tabloda o kalemin ayrıntısı açılır. */
export const detailError = (errors, names) => names.some((n) => errors?.[n])

/**
 * Ayrıntı alanlarının GÖSTERİLEN değeri: girilmemiş alan şablonun varsayılanıyla (lokasyon
 * kategoriden, kişi 1, yansıtma şirketi kendi şirketim). Cümleye yalnız kişinin seçtiği gider —
 * HR MCP aynı varsayılanı kullanır (`promptTemplates`), yani gösterilen ile işlenen aynı.
 */
export function withDefaults(fields, values) {
  const out = { ...values }
  for (const f of fields)
    if (out[f.name] === undefined && f.slot.addDefault) out[f.name] = f.slot.addDefault(values)
  return out
}

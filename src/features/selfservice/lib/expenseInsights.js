import { isFutureDate } from "@/features/selfservice/lib/expenseHints"
import { submittedRows } from "@/features/selfservice/lib/expenseHistory"
import { formErrors, parseAmount } from "@/lib/requestForm"
import { expenseSummary } from "@/features/selfservice/lib/requestFormItems"

/**
 * MASRAF ÖZETİ — saf hesap (masraf formunun "Masraf özeti" paneli). Her şey formdaki kalemlerden
 * çıkar, bilinmeyen bir kural söylenmez: para birimine göre toplamlar (çevrilmez; TRY önce),
 * kalem kalem eksikler (`formErrors` — gönderimi engelleyenlerin aynısı), tarih aralığı, ileri
 * tarihli kalemler, birbirinin aynısı görünen kalemler, ERP'de eşi olabilecek kalemler (kişinin
 * masraf geçmişi verilirse) ve kategori dağılımı. Fişler kalemin değil
 * masrafın (ERP'de başlığa eklenir): yalnız sayıları gelir, kalem kalem fiş hesabı yok.
 */

const isDay = (d) => d instanceof Date && !Number.isNaN(d.getTime())
const dayKey = (d) => (isDay(d) ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null)
const text = (v) => String(v ?? "").trim()

/**
 * Birbirinin aynısı görünen kalemler: tarih (gün), tutar, para birimi, kategori ve yazılan
 * alanların hepsi aynı (fiş no farklıysa ayrı harcamadır: iki otopark fişi). Engellemez, yalnız
 * uyarır. Dönüş: sonraki kalemler `{ rowId, n, of }` (`of`: aynısı olan ilk kalemin numarası).
 */
export function duplicateRows(rows, locale = "tr") {
  const seen = new Map()
  const out = []
  ;(rows ?? []).forEach((row, i) => {
    const v = row.values ?? {}
    const amount = parseAmount(v.amount, locale)
    const day = dayKey(v.date)
    if (amount == null || !day || !v.category) return
    const key = [
      day,
      amount,
      v.currency ?? "TRY",
      v.category,
      text(v.note),
      text(v.receipt),
      text(v.firm),
      v.location ?? "",
      text(v.people),
    ].join("\u0001")
    const first = seen.get(key)
    if (first) out.push({ rowId: row.id, n: i + 1, of: first })
    else seen.set(key, i + 1)
  })
  return out
}

/**
 * Kategori dağılımı: her kategori için para birimine göre toplam ve kalem sayısı, büyükten
 * küçüğe (`order`: para birimlerinin önceliği — genel toplamın sırası; ilk farklı olan karar
 * verir, eşitse kalem sayısı, sonra ad). İlk `top` kategori ve kalanların sayısı. Tek para
 * biriminde `share` (0–1): kategorinin genel toplamdaki payı; birden çok para biriminde pay yok
 * (çevrilmeden karşılaştırılamaz).
 */
export function categoryBreakdown(rows, locale = "tr", order = [], top = 4) {
  const by = new Map()
  for (const row of rows ?? []) {
    const v = row.values ?? {}
    if (!v.category) continue
    const entry = by.get(v.category) ?? { category: v.category, sums: {}, count: 0 }
    entry.count += 1
    const amount = parseAmount(v.amount, locale)
    if (amount != null) {
      const cur = v.currency ?? "TRY"
      entry.sums[cur] = (entry.sums[cur] ?? 0) + amount
    }
    by.set(v.category, entry)
  }
  const list = [...by.values()].sort((a, b) => {
    for (const cur of order) {
      const d = (b.sums[cur] ?? 0) - (a.sums[cur] ?? 0)
      if (d) return d
    }
    return b.count - a.count || a.category.localeCompare(b.category, "tr")
  })
  const single = order.length === 1 ? order[0] : null
  const whole = single ? list.reduce((n, e) => n + (e.sums[single] ?? 0), 0) : 0
  const shareOf = (e) => (single && whole > 0 ? (e.sums[single] ?? 0) / whole : null)
  const shown = list.slice(0, top).map((e) => ({
    category: e.category,
    count: e.count,
    totals: order.filter((cur) => e.sums[cur] != null).map((cur) => [cur, e.sums[cur]]),
    share: shareOf(e),
  }))
  const rest = list.slice(top)
  return {
    top: shown,
    rest: rest.length,
    restShare: single && whole > 0 ? rest.reduce((n, e) => n + shareOf(e), 0) : null,
    currency: single,
  }
}

/**
 * Masraf özeti. `rows`: formun kalemleri (`{ id, values }`); `receipts`: masrafın (başlığın) fiş
 * sayısı; `today`: bugünün başı (ileri tarih); `top`: dağılımda gösterilecek kategori sayısı;
 * `history`: kişinin ERP masraf raporları (yoksa ERP karşılaştırması yapılmaz).
 * Dönüş: `count` · `totals` (`[[para birimi, toplam]]`) · `currency` (ilk kalemin para birimi;
 * tutar yokken sıfırın birimi) · `receipts` · `missing` (`{ rowId, n, field, error }`, kalem ve
 * şablon sırasıyla) · `period` (`{ from, to }` ya da null) · `future` · `duplicates` ·
 * `submitted` (`{ rowId, n, match }`, `features/selfservice/lib/expenseHistory`) · `categories`.
 */
export function expenseInsights(
  rows,
  { locale = "tr", today = new Date(), top = 4, receipts = 0, history = null } = {},
) {
  const list = rows ?? []
  const { totals } = expenseSummary(list, locale)
  const missing = []
  const future = []
  let from = null
  let to = null
  list.forEach((row, i) => {
    const n = i + 1
    const v = row.values ?? {}
    for (const [field, error] of Object.entries(formErrors("expense", v)))
      missing.push({ rowId: row.id, n, field, error })
    if (isDay(v.date)) {
      if (!from || v.date < from) from = v.date
      if (!to || v.date > to) to = v.date
      if (isFutureDate(v.date, today)) future.push({ rowId: row.id, n })
    }
  })
  return {
    count: list.length,
    totals,
    currency: list[0]?.values?.currency ?? "TRY",
    receipts,
    missing,
    period: from ? { from, to } : null,
    future,
    duplicates: duplicateRows(list, locale),
    submitted: submittedRows(list, history, locale),
    categories: categoryBreakdown(
      list,
      locale,
      totals.map(([cur]) => cur),
      top,
    ),
  }
}

/**
 * Kalem kalem uyarılar (tablonun ve kartların işareti): `Map(rowId → { submitted, twins })`.
 * `submitted`: ERP'deki olası eş (`features/selfservice/lib/expenseHistory`); `twins`: formda aynısı görünen öteki
 * kalemlerin numaraları — ilk kalem de kopyası da işaretlenir (hangisinin fazla olduğunu kişi
 * bilir). Yalnız uyarısı olan kalemler haritada.
 */
export function lineWarnings(rows, history, locale = "tr") {
  const list = rows ?? []
  const out = new Map()
  const entry = (id) => {
    if (!out.has(id)) out.set(id, { submitted: null, twins: [] })
    return out.get(id)
  }
  for (const s of submittedRows(list, history, locale)) entry(s.rowId).submitted = s.match
  // Aynı ilk kaleme bağlanan kopyalar tek küme: kümedeki her kalem ötekileri anar.
  const groups = new Map()
  for (const d of duplicateRows(list, locale)) {
    const group = groups.get(d.of) ?? [d.of]
    group.push(d.n)
    groups.set(d.of, group)
  }
  for (const group of groups.values())
    for (const n of group) entry(list[n - 1].id).twins = group.filter((m) => m !== n)
  return out
}

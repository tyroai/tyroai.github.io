import "@/lib/i18n/selfService"
import { headClauses, ownerPhrase } from "@/lib/expenseHead"
import {
  PROMPT_TEMPLATES,
  composeTemplate,
  initialValues,
  isSlotEmpty,
  isValidAmount,
} from "@/lib/promptTemplates"

/**
 * SELF SERVİS TALEP FORMLARI — saf katman. Alanlar sohbetin alanlı şablonundan
 * (`PROMPT_TEMPLATES`) üretilir; gönderilen metin de şablonun cümlesidir (`composeTemplate`),
 * yani form ile bestecideki cümle asistana aynı biçimde ulaşır. Ayrıntı:
 * docs/features/self-servis-talep.md.
 */

/** Sayfanın talep türü → şablon anahtarı. */
export const FORM_TEMPLATE = { leave: "leaveRequest", expense: "expense", advance: "advance" }

/**
 * Formun alanları, şablondaki tanım sırasıyla. Tutarın para birimi ayrı satır değil, tutar
 * alanının eki (`unit`). `extra`: eklenebilir alanlar — formda "+ alan" çipiyle açılır.
 * `omit`: formda kalemde olmayan alanlar (masrafta şirket başlıkta, `EXPENSE_ROW_OMIT`).
 */
export function formFields(key, omit = []) {
  const slots = PROMPT_TEMPLATES[key]?.slots ?? {}
  const main = []
  const extra = []
  for (const [name, slot] of Object.entries(slots)) {
    if ((name === "currency" && slots.amount) || omit.includes(name)) continue
    const field = { name, slot, unit: name === "amount" && slots.currency ? "currency" : null }
    ;(slot.addable ? extra : main).push(field)
  }
  return { main, extra }
}

/**
 * Alanların hataları: `required` (boş zorunlu), `amount` (geçersiz tutar), `order` (bitiş
 * başlangıçtan önce). Eklenmemiş eklenebilir alan denetlenmez.
 */
export function formErrors(key, values) {
  const slots = PROMPT_TEMPLATES[key]?.slots ?? {}
  const out = {}
  for (const [name, slot] of Object.entries(slots)) {
    const value = values?.[name]
    if (slot.addable && value === undefined) continue
    const typed = String(value ?? "").trim() !== ""
    if (slot.type === "amount" && typed && !isValidAmount(value)) out[name] = "amount"
    else if (slot.required && isSlotEmpty(slot, value)) out[name] = "required"
    else if (slot.after && value && values[slot.after] && value < values[slot.after])
      out[name] = "order"
  }
  return out
}

/** Masraf kaleminde olmayan şablon alanları: şirket bütün kalemler için tek, formun başlığında. */
export const EXPENSE_ROW_OMIT = ["company"]

/** Formda baştan açık eklenebilir alanlar: masrafın açıklaması en sık yazılan isteğe bağlı alan. */
export const FORM_OPEN = { expense: ["note"] }

/** Yeni masraf satırı: varsayılanlar (bugün, TRY, boş açıklama) ya da kopyalanan satırın değerleri. */
export function newExpenseRow(id, from) {
  const values = from ? { ...from.values } : { ...initialValues("expense"), note: "" }
  return { id, values }
}

const sameValue = (a, b) =>
  a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b

/**
 * Kişi bir şey girdi mi: başlangıçtakinden farklı dolu bir alan (sonradan eklenen fiş no, firma,
 * kişi sayısı, şirket… dahil). Doluysa form sormadan kapanmaz.
 */
export function valuesChanged(initial, values) {
  return Object.entries(values ?? {}).some(
    ([k, v]) => String(v ?? "").trim() !== "" && !sameValue(v, initial?.[k]),
  )
}

// İzin gün sayısının kuralı çalışma günü takviminde (tek tatil tablosu, tek ağırlık).
export { leaveWorkdays } from "@/lib/leaveDays"

const decimalOf = (locale) => {
  try {
    return (
      new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === "decimal")?.value ??
      "."
    )
  } catch {
    return "."
  }
}

/**
 * Doğu Arap rakamları (٠–٩, ۰–۹) ve ayraçları (٫ ondalık, ٬ binlik) ASCII'ye: Arapça klavyeyle
 * yazılan tutar da geçerli sayılsın ve asistana Latin rakamla gitsin.
 */
export function asciiDigits(value) {
  return String(value ?? "")
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\u066b/g, ".")
    .replace(/\u066c/g, ",")
}

/** Tutar alanının yer tutucusu yerel ayraçla ("0,00" · "0.00"), Latin rakamla. */
export function amountPlaceholder(locale) {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      numberingSystem: "latn",
    }).format(0)
  } catch {
    return "0.00"
  }
}

/**
 * Yazılan tutarın sayısı (toplam ön izlemesi için; asistana yazılan metin gider). İki ayraç
 * varsa sondaki ondalıktır; tek ayraç ardından tam üç hane geliyorsa ve yerelin ondalığı
 * değilse binliktir ("1.250" TR'de bin iki yüz elli).
 */
export function parseAmount(value, locale = "tr") {
  const v = String(value ?? "").replace(/\s/g, "")
  if (!isValidAmount(v)) return null
  const dot = v.lastIndexOf(".")
  const comma = v.lastIndexOf(",")
  let dec = null
  if (dot >= 0 && comma >= 0) dec = dot > comma ? "." : ","
  else if (dot >= 0 || comma >= 0) {
    const sep = dot >= 0 ? "." : ","
    const parts = v.split(sep)
    const grouping = parts.length > 2 || (parts[1].length === 3 && sep !== decimalOf(locale))
    dec = grouping ? null : sep
  }
  const at = dec ? v.lastIndexOf(dec) : -1
  const whole = (at >= 0 ? v.slice(0, at) : v).replace(/[.,]/g, "")
  const frac = at >= 0 ? v.slice(at + 1) : ""
  const n = Number(frac ? `${whole}.${frac}` : whole)
  return Number.isFinite(n) ? n : null
}

/** Masraf satırlarının para birimine göre toplamı `{ TRY: 1250.5, USD: 40 }` (geçersizler hariç). */
export function expenseTotals(rows, locale) {
  const out = {}
  for (const r of rows) {
    const n = parseAmount(r.values.amount, locale)
    if (n == null) continue
    const cur = r.values.currency ?? "TRY"
    out[cur] = (out[cur] ?? 0) + n
  }
  return out
}

const extOf = (file) => {
  const fromName = /\.([a-z0-9]{2,5})$/i.exec(file?.name ?? "")?.[1]
  if (fromName) return fromName.toLowerCase()
  const sub = String(file?.type ?? "").split("/")[1] ?? ""
  return sub.replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "bin"
}

/**
 * Fiş görsellerinin sohbete gidecek adları, sırayla ("fis-1.jpg", "fis-2.pdf"). Fişler masrafın
 * BAŞLIĞINA eklenir (HR MCP `attach_expense_receipt`; ERP'de kaleme değil), yani ad bir kalemle
 * eşleşmez. Telefon kamerası her fotoğrafı "image.jpg" adlandırıyor; mesaj dosyayı bu adla anar.
 */
export function receiptNames(files, base) {
  return files.map((f, j) => `${base(j + 1)}.${extOf(f)}`)
}

/**
 * Fişler önce küçültülür (`compress`: sohbetin gönderimdeki `compressImageFile`i), SONRA
 * adlandırılır: küçültme PNG/WebP/BMP'yi JPEG'e çevirip adı ".jpg" yapıyor. Gönderimdeki ikinci
 * küçültme adı değiştirmez (uzantı zaten çıktınınki), cümledeki ad ekin adıyla aynı kalır.
 * `compress(dosya, sıra)`: sıra, fişin döndürmesini bulmak için. Dönüş: `{ names, files }` —
 * `names[j]` mesajda anılan ad.
 */
export async function packReceipts(files, base, compress) {
  const packed = await Promise.all(files.map((f, i) => compress(f, i)))
  const names = receiptNames(packed, base)
  return {
    names,
    files: packed.map(
      (f, j) => new File([f], names[j], { type: f.type, lastModified: f.lastModified }),
    ),
  }
}

/** Şablonun cümlesi: izin ve avans. */
export const requestMessage = (t, locale, key, values) => composeTemplate(t, locale, key, values)

// Talep formunun masraf cümleleri: tek kalem ("Kendim için … girmek istiyorum.") ve listedeki kalem.
const ONE = "selfService.form.expense.one"
const LINE = "selfService.form.expense.line"

/**
 * Masraf → tek mesaj. `head`: başlık (`expenseHead.js`) — kimin adına (`owner`: `{ name, email }`
 * ya da boş = kendim), şirket ve açıklama; İK MCP'sinde üçü de başlığın alanı. Tek kalem: tek
 * cümle + başlığın yan cümleleri. Çok kalem: "Kendim için aşağıdaki 3 masrafı gir:" + numaralı
 * kalem cümleleri + başlığın yan cümleleri ayrı satırda. `names`: masrafın fişlerinin adları —
 * fişler başlığa eklenir, mesajda bir kez başlığın yan cümleleriyle anılır (kalemde değil).
 */
export function expenseMessage(t, locale, rows, names = [], head = null) {
  const owner = ownerPhrase(t, head?.owner)
  const tail = head ? headClauses(t, head) : ""
  const receipts = names?.length
    ? t(
        names.length > 1 ? "selfService.form.receiptClauseMany" : "selfService.form.receiptClause",
        {
          names: names.join(", "),
        },
      )
    : ""
  if (rows.length === 1) {
    const one = composeTemplate(t, locale, "expense", rows[0].values, ONE, { owner })
    return `${one}${receipts}${tail}`
  }
  const lines = rows.map(
    (r, i) => `${i + 1}. ${composeTemplate(t, locale, "expense", r.values, LINE)}`,
  )
  const header = t("selfService.form.expense.many", { owner, n: rows.length })
  const last = `${receipts}${tail}`.trim()
  return [header, ...lines, ...(last ? [last] : [])].join("\n")
}

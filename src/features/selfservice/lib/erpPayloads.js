import { ADVANCE_PURPOSES, COMPANIES, EXPENSE_CATEGORY_PAIRS } from "@/data/hrValues"
import { OWN, SELF } from "@/lib/expenseHead"
import { ymd } from "@/lib/leaveDays"
import { parseAmount } from "@/lib/requestForm"

/**
 * ERP'YE DOĞRUDAN YAZMA — formun değerlerinden Dataverse sanal tablolarının kayıtları (saf).
 * Alanlar ve değerler İK MCP'sinin yazma araçlarıyla BİREBİR (`tyro-hr-mcp` › `tools/hr.py`:
 * `create_leave_request`, `create_employee_expense`, `create_cash_advance`); MCP F&O'nun OData
 * ucuna yazıyor, tarayıcı ise aynı F&O tablolarının Dataverse projeksiyonuna (F&O'nun ucu CORS
 * başlığı döndürmüyor). Biri değişirse öteki de değişir. Ayrıntı: docs/features/self-servis-talep-erp.md.
 *
 * Builder'lar ya `{ ok: true, … }` ya `{ ok: false, errors: [{ key, vars }] }` döner — ERP'ye
 * gitmeden önce yakalanan sorun (sözlük anahtarı) yazma denemesine dönüşmesin.
 */

// Dataverse seçenek değerleri (F&O enum'larının projeksiyonu; EntityDefinitions'tan okundu).
export const YES = 200000001
export const NOT_SUBMITTED = 200000000
export const LOCATION_VALUE = Object.freeze({ abroad: 200000000, domestic: 200000001 })
export const PAYMENT_VALUE = Object.freeze({ bank: 200000000, cash: 200000001 })
export const UNDOCUMENTED_VALUE = Object.freeze({ documented: 200000000, undocumented: 200000001 })

// Formun izin türü → ERP kodu. ERP adları `selfService.leaveType.TR..`; onay penceresi ERP adını
// gösterir, eşleme kişiye görünür. Babalık izni İş Kanunu'nun "doğum izni"dir (TR03), annenin
// izni "analık" (TR04); mazeretin ERP'deki karşılığı idari izin.
export const LEAVE_KIND_CODE = Object.freeze({
  annual: "TR01",
  excuse: "TR08",
  sick: "TR09",
  paternity: "TR03",
  maternity: "TR04",
  marriage: "TR07",
  bereavement: "TR13",
  unpaid: "TR12",
})

// İK MCP'sinin varsayılanları (boş açıklamada aynı metin gitsin).
export const LEAVE_NOTE = "İzin talep ediyorum."
export const ADVANCE_NOTE = "İş avansı talep ediyorum."
export const EXPENSE_WF_NOTE = "TYRO WF"
// Masraf başlığının kaynak şirketi ve onay akışı kaydının şirketi: İK MCP'sinin yazdığı
// kayıtlarda canlıda böyle (onay akışı satırlarının hepsi `dtrk`, ölçüldü).
const SOURCE_COMPANY = "HRMS"
const WF_COMPANY = "dtrk"

// Dataverse'ün alan sınırları (karakter). Aşan değer ERP'ye gitmeden yakalanır.
export const LIMITS = Object.freeze({
  explanation: 100,
  firm: 100,
  receipt: 20,
  costType: 30,
  people: 60,
  purpose: 60,
  destination: 255,
})

const err = (key, vars) => ({ key, vars })
const text = (v) => String(v ?? "").trim()
const len = (v) => [...text(v)].length

/** "YYYY-AA-GG" — form tarihleri yerel gece yarısı Date; taslaktan dize de gelebilir. */
export function dayOf(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return ymd(value)
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(text(value))
  return m ? m[1] : null
}

/**
 * Kategori başlığı → ERP değeri. ERP kodu 30 karakter: listedeki dört uzun değer canlı
 * kayıtlarda kesik duruyor ("Gider Kaydedilen Küçük Demirba"); aynı kesik değer gider.
 */
export function costTypeOf(title) {
  const pair = EXPENSE_CATEGORY_PAIRS.find(([t, v]) => t === title || v === title)
  return pair ? [...pair[1]].slice(0, LIMITS.costType).join("") : null
}

/**
 * Masraf kaleminin yeri — İK MCP'sinin `resolve_location`ı: kategori yeri söylüyorsa o
 * (yurtiçi kategoriye yurtdışı yazılınca ERP vergi gruplarını boş bırakıyor), nötrse kişinin
 * seçimi, seçim yoksa yurtiçi.
 */
export function locationOf(title, given) {
  const value = EXPENSE_CATEGORY_PAIRS.find(([t]) => t === title)?.[1] ?? ""
  const hay = `${title ?? ""} ${value}`.toLowerCase()
  if (hay.includes("yurtdışı") || hay.includes("y.dışı")) return "abroad"
  if (hay.includes("yurtiçi") || hay.includes("y.içi")) return "domestic"
  return given === "abroad" ? "abroad" : "domestic"
}

/** İzin talebi → `mserp_tryaiboraxallowancetransselfentities` kaydı. */
export function leavePayload({ values, email }) {
  const errors = []
  const code = LEAVE_KIND_CODE[values?.kind]
  const start = dayOf(values?.start)
  const end = dayOf(values?.end)
  if (!text(email)) errors.push(err("selfService.erp.err.noWorker"))
  if (!code) errors.push(err("selfService.erp.err.leaveKind"))
  if (!start || !end || start > end) errors.push(err("selfService.erp.err.dates"))
  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    code,
    // Formdaki seçim ("paternity"): ekranda kişinin seçtiği ad, ERP'nin adı ("Doğum İzni") yanında.
    kind: values.kind,
    record: {
      mserp_allowancetypeid: code,
      mserp_dataareaid: SOURCE_COMPANY,
      mserp_description: LEAVE_NOTE,
      mserp_email: text(email),
      mserp_startdate: start,
      mserp_enddate: end,
      mserp_isworkflow: YES,
    },
  }
}

/** Bir masraf kalemi → satır kaydı (`mserp_expnumber` yazım sırasında eklenir). */
export function expenseLine(values, locale, n) {
  const errors = []
  const costType = costTypeOf(values?.category)
  const date = dayOf(values?.date)
  const amount = parseAmount(values?.amount, locale)
  const currency = text(values?.currency || "TRY").toUpperCase()
  const note = text(values?.note)
  const firm = text(values?.firm)
  const receipt = text(values?.receipt)
  if (!costType) errors.push(err("selfService.erp.err.category", { n }))
  if (!date) errors.push(err("selfService.erp.err.date", { n }))
  if (amount == null || amount <= 0) errors.push(err("selfService.erp.err.amount", { n }))
  if (len(note) > LIMITS.explanation)
    errors.push(err("selfService.erp.err.tooLong.note", { n, max: LIMITS.explanation }))
  if (len(firm) > LIMITS.firm)
    errors.push(err("selfService.erp.err.tooLong.firm", { n, max: LIMITS.firm }))
  if (len(receipt) > LIMITS.receipt)
    errors.push(err("selfService.erp.err.tooLong.receipt", { n, max: LIMITS.receipt }))
  if (errors.length) return { ok: false, errors }
  const people = Number.parseInt(text(values?.people), 10)
  const location = locationOf(values?.category, values?.location)
  return {
    ok: true,
    location,
    record: {
      mserp_costtype: costType,
      mserp_transdate: date,
      mserp_amount: amount,
      mserp_currency: currency,
      mserp_trydocumentnumber: receipt,
      mserp_trycostlocation: LOCATION_VALUE[location],
      mserp_explanation: note,
      // Firma girilmediyse boş: eski self servis akışı açıklamayı buraya da yazıyordu ve ERP'deki
      // Firma Adı açıklamanın kopyası oluyordu (kullanıcı kararı; İK MCP'si de aynı).
      mserp_companyname: firm,
      mserp_numberofpeople: String(Number.isFinite(people) && people >= 1 ? people : 1),
    },
  }
}

/**
 * Masraf → başlık + satırlar + onay akışı kaydı (İK MCP'sinin üç yazımı). `head`: formun başlığı
 * (kimin adına `owner`: `SELF` ya da e-posta; `company`: `OWN` ya da kod); `title`: gidecek
 * açıklama (boşsa formun varsayılanı, `titleOf`); `email`: kişinin ERP adresi (kendisi için).
 */
export function expensePayloads({ rows, head, title, email, locale, today = new Date() }) {
  const errors = []
  const owner = !head?.owner || head.owner === SELF ? text(email) : text(head.owner)
  const company = !head?.company || head.company === OWN ? "" : text(head.company)
  const desc = text(title)
  if (!owner) errors.push(err("selfService.erp.err.noWorker"))
  if (company && !COMPANIES[company]) errors.push(err("selfService.erp.err.company"))
  if (!desc) errors.push(err("selfService.erp.err.title"))
  if (len(desc) > LIMITS.explanation)
    errors.push(err("selfService.erp.err.tooLong.title", { max: LIMITS.explanation }))
  if (!rows?.length) errors.push(err("selfService.erp.err.noLines"))
  const lines = []
  ;(rows ?? []).forEach((r, i) => {
    const line = expenseLine(r.values ?? r, locale, i + 1)
    if (line.ok) lines.push(line)
    else errors.push(...line.errors)
  })
  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    owner,
    company,
    lines,
    header: {
      mserp_transdate: ymd(today),
      mserp_workflowstatus: NOT_SUBMITTED,
      mserp_explanation: desc,
      mserp_email: owner,
      mserp_sourcecompanyid: SOURCE_COMPANY,
      mserp_targetcompanyid: company,
    },
    workflow: (expNumber) => ({
      mserp_expnumber: expNumber,
      mserp_description: EXPENSE_WF_NOTE,
      mserp_dataareaid: WF_COMPANY,
    }),
  }
}

/**
 * İş avansı → `mserp_tryaitrvcashadvanceentities` kaydı. Onay akışını `mserp_isworkflow` (Yes)
 * başlatır — İK MCP'sinin `IsWorkflow: "Yes"`ı; ERP tarafı alanı Dataverse'te yazılabilir yaptı
 * (IsValidForCreate = true). Açıklama formda yok, MCP'nin varsayılanı gider. Plan, ekranda
 * gösterilecek seçimleri de taşır (`purpose` · `payment` · `document`).
 */
export function advancePayload({ values, email, locale }) {
  const errors = []
  const date = dayOf(values?.date)
  const amount = parseAmount(values?.amount, locale)
  const purpose = ADVANCE_PURPOSES[values?.purpose]
  const destination = text(values?.destination)
  const company = text(values?.company)
  if (!text(email)) errors.push(err("selfService.erp.err.noWorker"))
  if (!date) errors.push(err("selfService.erp.err.date", { n: 1 }))
  if (amount == null || amount <= 0) errors.push(err("selfService.erp.err.amount", { n: 1 }))
  if (!purpose) errors.push(err("selfService.erp.err.purpose"))
  if (!destination) errors.push(err("selfService.erp.err.destination"))
  if (!COMPANIES[company]) errors.push(err("selfService.erp.err.company"))
  if (errors.length) return { ok: false, errors }
  const payment = PAYMENT_VALUE[values?.payment] ? values.payment : "bank"
  const document = UNDOCUMENTED_VALUE[values?.document] ? values.document : "documented"
  return {
    ok: true,
    purpose: values.purpose,
    payment,
    document,
    record: {
      mserp_dataareaid: SOURCE_COMPANY,
      mserp_email: text(email),
      mserp_requesteddate: date,
      mserp_requestedamountcur: amount,
      mserp_currencycode: text(values?.currency || "TRY").toUpperCase(),
      mserp_purpose: purpose,
      mserp_destination: destination,
      mserp_targetcompanyid: company,
      mserp_trypaymentmode: PAYMENT_VALUE[payment],
      mserp_notes: ADVANCE_NOTE,
      mserp_tryundocumented: UNDOCUMENTED_VALUE[document],
      mserp_isworkflow: YES,
    },
  }
}

import { COMPANIES, EXPENSE_CATEGORY_PAIRS } from "@/data/hrValues"
import { formatMoney } from "@/lib/amountParse"
import { getDateTimeFormat } from "@/lib/intl-cache"

/**
 * "ERP'ye gönderilsin mi?" penceresinin satırları (saf): ERP'ye YAZILACAK değerler, kişinin
 * tanıdığı adlarla — İK MCP'sinin onay önizlemesinin karşılığı (izin türünün ERP adı ve kodu,
 * kategori, kalemin yeri, şirket). `plan`: `erpPayloads.js`in çıktısı.
 */

const DAY = { day: "numeric", month: "short", year: "numeric" }

export const dayText = (iso, locale) => {
  const [y, m, d] = String(iso).split("-").map(Number)
  return getDateTimeFormat(locale, DAY).format(new Date(y, m - 1, d))
}

export const categoryTitle = (value) =>
  EXPENSE_CATEGORY_PAIRS.find(([, v]) => v.startsWith(value))?.[0] ?? value

export const companyText = (t, code) =>
  code ? `${code} · ${COMPANIES[code] ?? ""}`.replace(/ · $/, "") : t("myspace.company.own")

/** Para birimine göre toplam ("₺450,00 + $40,00"). */
export function linesTotal(lines, locale) {
  const sums = {}
  for (const { record } of lines)
    sums[record.mserp_currency] = (sums[record.mserp_currency] ?? 0) + record.mserp_amount
  return Object.entries(sums)
    .map(([cur, v]) => formatMoney(v, cur, locale))
    .join(" + ")
}

/** Bir kalemin tek satırlık özeti. */
export function lineText(t, locale, { record, location }) {
  const parts = [
    categoryTitle(record.mserp_costtype),
    dayText(record.mserp_transdate, locale),
    formatMoney(record.mserp_amount, record.mserp_currency, locale),
    t(`myspace.location.${location}`),
  ]
  if (record.mserp_trydocumentnumber)
    parts.push(t("selfService.erp.preview.receiptNo", { value: record.mserp_trydocumentnumber }))
  if (record.mserp_companyname && record.mserp_companyname !== record.mserp_explanation)
    parts.push(record.mserp_companyname)
  if (record.mserp_explanation) parts.push(record.mserp_explanation)
  if (record.mserp_numberofpeople !== "1")
    parts.push(t("selfService.erp.preview.people", { n: record.mserp_numberofpeople }))
  return parts.join(" · ")
}

/** İş avansının etiket · değer çiftleri (tutar hariç): onay kartı ve önizleme aynı listeyi okur. */
export function advanceFacts(t, locale, plan) {
  const r = plan.record
  return [
    [t("selfService.erp.preview.employee"), r.mserp_email],
    [t("selfService.field.requested"), dayText(r.mserp_requesteddate, locale)],
    [t("selfService.field.purpose"), t(`myspace.purpose.${plan.purpose}`)],
    [t("selfService.field.location"), r.mserp_destination],
    [t("selfService.field.targetCompany"), companyText(t, r.mserp_targetcompanyid)],
    [t("selfService.field.paymentMode"), t(`selfService.value.${plan.payment}`)],
    [t("selfService.field.documented"), t(`selfService.value.${plan.document}`)],
    [t("selfService.erp.preview.note"), r.mserp_notes],
  ]
}

/**
 * Satırlar: `[{ label, value }]` ya da kalemlerde `[{ label, items: [] }]`. `extra`:
 * `{ ownerName, files }` — masrafın sahibinin adı ve fiş adları.
 */
export function erpPreview(t, locale, kind, plan, extra = {}) {
  if (kind === "advance") {
    const r = plan.record
    return [
      {
        label: t("selfService.field.amount"),
        value: formatMoney(r.mserp_requestedamountcur, r.mserp_currencycode, locale),
      },
      ...advanceFacts(t, locale, plan).map(([label, value]) => ({ label, value })),
      { label: t("selfService.erp.preview.after"), value: t("selfService.erp.preview.toApproval") },
    ]
  }
  if (kind === "leave") {
    const r = plan.record
    return [
      { label: t("selfService.erp.preview.employee"), value: r.mserp_email },
      {
        label: t("selfService.erp.preview.leaveType"),
        value: `${t(`selfService.leaveType.${plan.code}`)} (${plan.code})`,
      },
      {
        label: t("selfService.erp.preview.dates"),
        value: `${dayText(r.mserp_startdate, locale)} – ${dayText(r.mserp_enddate, locale)}`,
      },
      { label: t("selfService.erp.preview.note"), value: r.mserp_description },
      { label: t("selfService.erp.preview.after"), value: t("selfService.erp.preview.toManager") },
    ]
  }
  const owner = extra.ownerName ? `${extra.ownerName} · ${plan.owner}` : plan.owner
  const rows = [
    { label: t("selfService.erp.preview.owner"), value: owner },
    { label: t("selfService.erp.preview.company"), value: companyText(t, plan.company) },
    { label: t("selfService.erp.preview.title"), value: plan.header.mserp_explanation },
    {
      label: t("selfService.erp.preview.lines", { n: plan.lines.length }),
      items: plan.lines.map((l) => lineText(t, locale, l)),
    },
  ]
  if (extra.files?.length)
    rows.push({
      label: t("selfService.erp.preview.files", { n: extra.files.length }),
      value: extra.files.join(", "),
    })
  rows.push(
    { label: t("selfService.form.totalLabel"), value: linesTotal(plan.lines, locale) },
    { label: t("selfService.erp.preview.after"), value: t("selfService.erp.preview.toApproval") },
  )
  return rows
}

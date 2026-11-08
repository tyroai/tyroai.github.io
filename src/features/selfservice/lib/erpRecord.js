import { leaveWorkdays } from "@/lib/requestForm"
import { expenseCategoryName } from "@/lib/selfServiceNames"

/**
 * ERP'ye az önce yazılan talebin KAYIT biçimi (saf): Self Servis listesindeki kaydın şekli
 * (`selfServiceModel.js`), basılı formun (`recordForms.js`) okuduğu alanlarla — "ERP'ye
 * işlendi" penceresindeki Yazdır ve İmzala & Mail kayıt ayrıntısındaki düğmelerin aynısı olsun
 * diye. Değerler ERP'ye giden kayıttan (`plan`, `erpPayloads.js`) ve yazımın sonucundan
 * (`result.number`); ERP'nin hesapladığı alanlar (raporlama para birimi tutarı, izin saati)
 * henüz bilinmiyor, formda boş kalır. "Kaydı göster"in açtığı ayrıntı da bunu okur: masrafta
 * toplam (para birimine göre), kategoriler ve kalem kimlikleri listedeki kaydın şekliyle.
 */

const dateOf = (iso) => {
  const [y, m, d] = String(iso ?? "")
    .split("-")
    .map(Number)
  return y && m && d ? new Date(y, m - 1, d) : null
}

const extra = (pairs) =>
  pairs.filter(([, value]) => value != null && value !== "").map(([key, value]) => ({ key, value }))

function leaveRecord(plan, typeName) {
  const r = plan.record
  const start = dateOf(r.mserp_startdate)
  const end = dateOf(r.mserp_enddate) ?? start
  return {
    kind: "leave",
    type: plan.code,
    typeName,
    start,
    end,
    days: leaveWorkdays(start, end),
    hours: null,
    extra: [],
    date: start,
  }
}

function expenseRecord(plan, number) {
  const date = dateOf(plan.header.mserp_transdate)
  const lines = plan.lines.map(({ record: r }, i) => {
    // Kendi şirketin para birimi TRY: o kalemin şirket para birimi tutarı kendisi.
    const domestic = r.mserp_currency === "TRY"
    return {
      id: `${number || "new"}#${i}`,
      date: dateOf(r.mserp_transdate),
      category: r.mserp_costtype,
      categoryName: expenseCategoryName(r.mserp_costtype),
      currency: r.mserp_currency,
      amount: r.mserp_amount,
      explanation: r.mserp_explanation ?? "",
      extra: extra([
        ["receipt", r.mserp_trydocumentnumber],
        ["vendor", r.mserp_companyname],
        ["amountMst", domestic ? r.mserp_amount : null],
        ["exchangeRate", domestic ? 1 : null],
      ]),
    }
  })
  const totals = {}
  for (const l of lines)
    if (l.amount != null) totals[l.currency] = (totals[l.currency] ?? 0) + l.amount
  return {
    kind: "expense",
    number: number ?? "",
    company: plan.company,
    date,
    lines,
    totals,
    categories: [...new Set(lines.map((l) => l.category).filter(Boolean))],
    categoryNames: [...new Set(lines.map((l) => l.categoryName).filter(Boolean))],
    extra: extra([["reportDate", date]]),
  }
}

/** `kind`: "leave" | "expense"; başka tür (ya da plan yoksa) `null` — formu yok. */
export function erpRecord(kind, plan, result, { typeName = "" } = {}) {
  if (!plan) return null
  if (kind === "leave") return leaveRecord(plan, typeName)
  if (kind === "expense") return expenseRecord(plan, result?.number)
  return null
}

import { COMPANIES } from "@/data/hrValues"
import {
  BOX_CSS,
  esc,
  field,
  formAmount,
  formDate,
  page,
  stat,
} from "@/features/selfservice/lib/formShell"
import { extraValue } from "@/lib/selfServiceFields"

/**
 * MASRAF FORMU — Self Servis kaydından. Sohbetteki masraf formundan (HR MCP `expense_form.py`)
 * ayrıştı: görünüm izin formuyla (`leaveFormSheet.js`) aynı dil — içi beyaz kutular, ince
 * çizgiler, renksiz rozet; A4 YATAY ve üstte TYRO'nun üç renkli çubuğu. İmza satırı yok.
 *
 * Kişi bilgileri izin formuyla aynı kaynaktan (Self Servis profili, yönetici `profile.manager`);
 * değeri olmayan satır basılmaz (boş "—" satırı yok).
 */

const EXPENSE_CSS =
  BOX_CSS +
  // Rozet ve özet şeridi içi renksiz: beyaz zemin, ince çerçeve (izin formu gibi).
  ".pill{padding:4px 12px;background:#fff;color:var(--ink);font-weight:550;" +
  "box-shadow:inset 0 0 0 1px var(--hair)}" +
  ".hero{margin-bottom:6mm;border:1px solid var(--hair);border-radius:10px;background:#fff;" +
  "box-shadow:none}" +
  ".hero div{padding:3.6mm 4mm}.hero div+div{border-left:1px solid var(--hair)}" +
  ".big{font-size:20px}" +
  ".cols{gap:6mm;align-items:start;margin-bottom:0}.cols .f{grid-template-columns:34mm 1fr}" +
  ".tbl{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}" +
  ".tbl th{padding:2.2mm 3mm 2.2mm 0;text-align:left;color:var(--muted);font-size:11.5px;" +
  "font-weight:500;border-bottom:1px solid var(--hair)}" +
  ".tbl td{padding:2.5mm 3mm 2.5mm 0;border-top:1px solid var(--hair);vertical-align:top}" +
  ".tbl tr:first-child td{border-top:0}" +
  ".tbl th:first-child,.tbl td:first-child{padding-left:4mm}" +
  ".tbl .sn{width:12mm;color:var(--faint)}" +
  ".tbl .n{text-align:right;padding-right:4mm;white-space:nowrap}" +
  ".tbl td.n{font-weight:600}" +
  ".tbl td.n small{margin-left:1.5mm;color:var(--muted);font-weight:500}" +
  ".tbl thead{display:table-header-group}.tbl tr{break-inside:avoid}" +
  // Kalem kutusu sayfadan taşarsa bölünür (yoksa bütün tablo ikinci sayfaya itilir); sütun
  // kutularının alt boşluğu sayfa sonunda boş sayfa açmasın.
  ".box.lines{break-inside:auto;overflow:visible}.cols .box{margin-bottom:0}"

// Grubun raporlama para birimi (RPB; Sabit Giderler'in RPB'si de USD).
const REPORTING_CURRENCY = "USD"

const num = (v) => {
  if (v == null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Şirket para birimi — yalnız kanıtla: kuru 1 olan kalem ya da RPB karşılığı hesaplanmış ama
 * şirket karşılığı taşımayan kalem (model, satır tutarıyla aynı olan karşılığı ve kuru düşürür).
 * Kanıt yoksa (ör. az önce yazılan yabancı kalem) boş: ilk kalemin birimi yanlış birim basardı.
 */
function companyCurrencyOf(lines) {
  const rated = lines.find((l) => num(extraValue(l.extra, "exchangeRate")) === 1)
  const domestic = lines.find(
    (l) =>
      num(extraValue(l.extra, "amountMst")) == null &&
      num(extraValue(l.extra, "amountReporting")) != null,
  )
  return (rated ?? domestic)?.currency ?? ""
}

/** Kalemlerin toplamı; bir kalemin değeri bilinmiyorsa "" (eksik toplam ya da "0,00" basılmaz). */
function sumKnown(lines, valueOf) {
  let sum = 0
  for (const l of lines) {
    const v = valueOf(l)
    if (v == null) return ""
    sum += v
  }
  return lines.length ? formAmount(sum) : ""
}

/**
 * Masraf formunun verisi: rapor + kişi (`{ profile, worker }`, Self Servis'in kendisi).
 * Düz metin döner, render kaçırır.
 */
export function expenseFormData(record, person) {
  const profile = person?.profile ?? {}
  const lines = record.lines ?? []
  const companyCurrency = companyCurrencyOf(lines)
  const ownIn = (l, currency) => (currency && l.currency === currency ? num(l.amount) : null)
  // Şirket karşılığı: kalemin kendi alanı; düşmüşse (yerli kalem) tutarın kendisi.
  const companyOf = (l) => num(extraValue(l.extra, "amountMst")) ?? ownIn(l, companyCurrency)
  // RPB karşılığı: kendi alanı; kalem ya da şirket USD ise düşmüş olabilir — o tutar.
  const reportingOf = (l) =>
    num(extraValue(l.extra, "amountReporting")) ??
    ownIn(l, REPORTING_CURRENCY) ??
    (companyCurrency === REPORTING_CURRENCY ? companyOf(l) : null)
  const code = String(record.company ?? "").toUpperCase()
  const manager = profile.manager ?? {}
  return {
    company: COMPANIES[code] ?? record.company ?? "",
    number: record.number ?? "",
    date: formDate(extraValue(record.extra, "reportDate") ?? record.date),
    totalCompany: sumKnown(lines, companyOf),
    companyCurrency,
    totalReporting: sumKnown(lines, reportingOf),
    reportingCurrency: REPORTING_CURRENCY,
    lines: lines.map((l) => ({
      date: formDate(l.date),
      category: l.category ?? "",
      firm: extraValue(l.extra, "vendor") ?? "",
      document: extraValue(l.extra, "receipt") ?? "",
      costCenter: extraValue(l.extra, "costCenter") ?? "",
      amount: formAmount(l.amount),
      currency: l.currency ?? "",
    })),
    employee: {
      name: profile.name ?? "",
      personnelNo: profile.personnel ?? person?.worker?.personnel ?? "",
      department: profile.department ?? "",
      position: profile.title ?? "",
    },
    manager: {
      name: manager.name ?? "",
      personnelNo: manager.personnel ?? "",
      department: manager.department ?? "",
      position: manager.title ?? "",
    },
  }
}

// İki kutu aynı dört satırı aynı sırayla taşır (yan yana hizalı); bilinmeyen değer "—".
// Kişi hiç yoksa (yöneticisi atanmamış) kutu basılmaz.
function personBox(heading, rows) {
  if (!rows.some(([, value]) => value)) return ""
  const body = rows.map(([label, value]) => field(label, value ? esc(value) : "—")).join("")
  return `<section class="box"><h2>${heading}</h2>${body}</section>`
}

export function renderExpenseForm(d) {
  const v = (k) => esc(d[k])
  const hero =
    stat("Tarih", v("date")) +
    stat("Toplam Tutar (Şirket Para Birimi)", v("totalCompany"), v("companyCurrency")) +
    stat("Toplam Tutar (RPB)", v("totalReporting"), v("reportingCurrency"))
  // Sıra: ne zaman · ne · kimden · hangi belge · hangi merkez · ne kadar (tutar + birim tek sütun).
  const head =
    '<tr><th class="sn">Sn</th><th>Tarih</th><th>Masraf Kategorisi</th><th>Firma</th>' +
    '<th>Belge No</th><th>M.Merkezi</th><th class="n">Tutar</th></tr>'
  const rows = (d.lines ?? [])
    .map((ln, i) => {
      const unit = ln.amount && ln.currency ? `<small>${esc(ln.currency)}</small>` : ""
      return (
        `<tr><td class="sn">${i + 1}</td><td>${esc(ln.date)}</td><td>${esc(ln.category)}</td>` +
        `<td>${esc(ln.firm)}</td><td>${esc(ln.document)}</td><td>${esc(ln.costCenter)}</td>` +
        `<td class="n">${esc(ln.amount)}${unit}</td></tr>`
      )
    })
    .join("")
  const e = d.employee ?? {}
  const m = d.manager ?? {}
  const people =
    personBox("Harcamayı Yapan", [
      ["Ad Soyad", e.name],
      ["Sicil No", e.personnelNo],
      ["Bölümü", e.department],
      ["Pozisyon", e.position],
    ]) +
    personBox("Bağlı Olduğu Kişi", [
      ["Ad Soyad", m.name],
      ["Sicil No", m.personnelNo],
      ["Bölümü", m.department],
      ["Pozisyon", m.position],
    ])
  const body =
    `<section class="hero">${hero}</section>` +
    '<section class="box lines"><h2>Masraflar</h2>' +
    `<table class="tbl"><thead>${head}</thead><tbody>${rows}</tbody></table></section>` +
    (people ? `<div class="cols">${people}</div>` : "")
  return page({
    title: `Masraf Formu · ${v("number")}`,
    heading: "Masraf Formu",
    sub: v("company"),
    pill: v("number"),
    body,
    css: EXPENSE_CSS,
  })
}

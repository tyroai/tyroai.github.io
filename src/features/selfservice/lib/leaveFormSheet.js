import { companyLabel } from "@/lib/companyName"
import {
  BOX_CSS,
  esc,
  field,
  formAmount,
  formDate,
  page,
} from "@/features/selfservice/lib/formShell"
import { extraValue } from "@/lib/selfServiceFields"

/**
 * PERSONEL İZİN/GÖREV FORMU — Self Servis kaydından (sohbettekinin aynısı, HR MCP
 * `services/leave_form.py`). Alanlar ERP'nin basılı formununkiler (istek üzerine);
 * görünüm bizim tema, A4 DİKEY, tek renk vurgu.
 *
 * Kaynaklar: kayıt (tür, tarih-saat, süre, açıklama) · Self Servis profili (ad, sicil, işe giriş,
 * şirket, bölüm, pozisyon — profil başlığında ne yazıyorsa o) · izin bakiyesi (kalan gün).
 * İşe başlama (dönüş) tarihi YOK, istek üzerine; yerinde izin bitiş tarihi. Değer hücreleri `data-f` taşır:
 * sohbetteki form tyro'da aynı anahtarlarla doldurulur (`leaveFormFill.js`).
 */

// İzin formu A4 DİKEY ve sade: ERP'nin "Personel İzin/Görev Formu"nun alanları, tek renk (lacivert)
// vurgu. Kutular ERP'nin etiket | değer düzeni; köşe, tipografi ve çizgiler bizim tema.
const LEAVE_CSS =
  "@page{size:A4 portrait;margin:12mm}" +
  ".sheet{width:186mm;padding:11mm 11mm 8mm}" +
  ".sheet:before{height:3px;background:var(--navy)}" +
  "h1{font-size:23px}" +
  ".pill{padding:4px 12px;background:#f1f5f9;color:var(--ink);font-weight:550;" +
  "box-shadow:inset 0 0 0 1px var(--hair)}" +
  BOX_CSS +
  ".box h2{background:#f8fafc}" +
  ".sig{display:grid;grid-template-columns:1fr 1fr;gap:16mm;margin-top:17mm}" +
  ".sig>div>div{padding-top:2.2mm;border-top:1px solid #94a3b8}" +
  ".sig span{display:block;color:var(--muted);font-size:12px}" +
  ".sig b{display:block;min-height:5mm;font-weight:500}" +
  ".sig p{margin:.6mm 0 0;font-weight:600;min-height:5mm}"

const clock = (v) => (typeof v === "string" ? v.slice(0, 5) : "")

/**
 * İzin formunun verisi: kayıt + kişi (`{ profile, worker, balance }`, Self Servis'in kendisi).
 * Düz metin döner, render kaçırır.
 */
export function leaveFormData(record, person) {
  const profile = person?.profile ?? {}
  const planned = Boolean(extraValue(record.extra, "planned"))
  const type = record.typeName || record.type || ""
  const days = Number(record.days) || 0
  const hours = Number(record.hours) || 0
  return {
    name: profile.name ?? "",
    personnelNo: profile.personnel ?? person?.worker?.personnel ?? "",
    hireDate: formDate(profile.hireDate),
    // Profil başlığındaki şirket çipiyle aynı: İK görünümü, kısa ad (`metaOf`).
    company: companyLabel(profile.companyCode, profile.company ?? ""),
    department: profile.department ?? "",
    position: profile.title ?? "",
    leaveType: type && planned ? `${type} - Planlı` : type,
    // Başlıktaki rozet yalnız tür adı ("Yıllık İzin"); planlı bilgisi tablodaki Türü satırında.
    typeName: type,
    // Tam günlükte "1,00 gün · 8,50 saat"; gün altında yalnız saat ("0,00 gün" yazılmaz).
    duration: days > 0 ? `${formAmount(days)} gün` : hours > 0 ? `${formAmount(hours)} saat` : "",
    durationNote: days > 0 && hours > 0 ? `${formAmount(hours)} saat` : "",
    startDate: formDate(record.start),
    startTime: clock(extraValue(record.extra, "startTime")),
    endDate: formDate(record.end),
    endTime: clock(extraValue(record.extra, "endTime")),
    balance: formAmount(person?.balance?.remain),
    description: record.description ?? "",
  }
}

export function renderLeaveForm(d) {
  const v = (k) => esc(d[k])
  const at = (date, time) => [date, time].filter(Boolean).join("  ")
  const personnel =
    field("Ad Soyad", v("name"), { key: "name" }) +
    field("İşe Giriş Tarihi", v("hireDate"), { key: "hire" }) +
    field("Şirketi", v("company"), { key: "company" }) +
    field("Bölümü", v("department"), { key: "department" }) +
    field("Pozisyon", v("position"), { key: "position" })
  const leave =
    field("Türü", v("leaveType")) +
    field("İzne Çıkış Tarihi", at(v("startDate"), v("startTime"))) +
    field("İzin Bitiş Tarihi", at(v("endDate"), v("endTime"))) +
    field("Süresi", v("duration"), { unit: v("durationNote") }) +
    field("Kalan Yıllık İzin Bakiyesi (Gün)", v("balance")) +
    field("Açıklama", v("description"))
  // "Personel İmzası" satırının biçimi `signedForm.js` ile SÖZLEŞME: imza oraya konur.
  const sign =
    `<div><div><b></b><span>Personel İmzası</span></div><p>${v("name")}</p></div>` +
    "<div><div><b></b><span>Yönetici İmzası</span></div><p></p></div>"
  const body =
    `<section class="box"><h2>İzin Kullanan Personelin</h2>${personnel}</section>` +
    `<section class="box"><h2>İznin</h2>${leave}</section>` +
    `<section class="sig">${sign}</section>`
  return page({
    title: `Personel İzin/Görev Formu · ${v("name")}`,
    heading: "Personel İzin/Görev Formu",
    sub: `${v("name")} · Sicil No ${v("personnelNo")}`,
    pill: v("typeName") || v("leaveType"),
    body,
    css: LEAVE_CSS,
  })
}

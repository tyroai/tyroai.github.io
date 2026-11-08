import { htmlOf, isPrintableHtml } from "@/lib/botFiles"

/**
 * Araçtan gelen formu (bkz. botFiles) ekranda imzalanmış hâle getirir.
 *
 * İmzanın yeri formdaki "Personel İmzası" çizgisidir. HR MCP o satırı
 * `<div><b>{tarih}</b><span>Personel İmzası</span></div>` olarak basıyor
 * (`tyro-hr-mcp` › `services/leave_form.py`); biçim bir SÖZLEŞMEDİR. Satır
 * bulunamazsa form imzalanabilir sayılmaz ve düğme hiç çizilmez: yanlış yere
 * konmuş bir imza, imzasız bir formdan kötüdür.
 *
 * Saf metin işlemi (DOM yok): birim testlerinde Node'da çalışır.
 */
const SLOT_LABEL = "Personel İmzası"
const SLOT_RE = new RegExp(`<div><b>[^<]*</b><span>${SLOT_LABEL}</span></div>`)

// İmza çizginin ÜSTÜNE oturur; çizgi `.sig div`in üst kenarı. Beyan cümlesinin
// altındaki 13 mm boşluk 12 mm'lik imzaya yetiyor.
const SIGN_CSS =
  ".tyro-sign{position:relative}" +
  ".tyro-sign img{position:absolute;left:0;bottom:calc(100% + 1mm);" +
  "max-height:12mm;max-width:100%;width:auto;height:auto}"

// Ekranda `@media print` kuralları çalışmaz; PDF kâğıttaki görünümü almalı
// (gri zemin, kart gölgesi ve Yazdır düğmesi yok). Değerler form_theme.py'nin
// yazdırma bloğunun aynısı; genişlik A4'ün (yatay ya da dik) 12 mm kenar payı içi.
const pdfCss = (portrait) =>
  "body{background:#fff!important;margin:0!important}" +
  `.sheet{width:${portrait ? 186 : 273}mm!important;margin:0!important;padding:2mm 1mm 0!important;` +
  "border-radius:0!important;box-shadow:none!important}" +
  ".print{display:none!important}"

/** Form A4 DİK mi (izin formu)? Masraf formu yatay kalır. `@page` kuralından okunur. */
export function isPortraitForm(html) {
  return /@page\{size:A4 portrait/.test(String(html))
}

const DATA_PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/

function injectCss(html, css) {
  const tag = `<style>${css}</style>`
  return html.includes("</head>") ? html.replace("</head>", () => `${tag}</head>`) : tag + html
}

/** Belgenin imza satırı var mı (yalnız bizim ürettiğimiz HTML'de bakılır). */
export function canSignHtml(html) {
  return typeof html === "string" && SLOT_RE.test(html)
}

export function canSignAttachment(att) {
  return isPrintableHtml(att) && canSignHtml(htmlOf(att))
}

/** İmza günü, ERP'nin tarih biçiminde (`5.10.2025`, gün sıfırsız, ay sıfırlı); saat yazılmaz. */
export function formatSignedAt(date) {
  return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`
}

/**
 * İmza görselini ve imza anını personel satırına koyar.
 * `signatureDataUrl` yalnız PNG data adresi olabilir: HTML'e ham girdi.
 */
export function signFormHtml(html, { signatureDataUrl, signedAt }) {
  if (!canSignHtml(html)) throw new Error("no-signature-slot")
  if (!DATA_PNG.test(signatureDataUrl)) throw new Error("bad-signature")
  const when = String(signedAt).replace(/[<>&"]/g, "")
  const slot = `<div class="tyro-sign"><img src="${signatureDataUrl}" alt=""><b>${when}</b><span>${SLOT_LABEL}</span></div>`
  return injectCss(
    html.replace(SLOT_RE, () => slot),
    SIGN_CSS,
  )
}

// Önizlemede imzanın geleceği yer: imzayla aynı konumda kesikli bir kutu.
const SLOT_CSS =
  ".tyro-slot{position:relative}" +
  ".tyro-slot i{position:absolute;left:0;bottom:calc(100% + 1mm);box-sizing:border-box;" +
  "width:48mm;height:12mm;display:flex;align-items:center;justify-content:center;" +
  "border:1.5px dashed #94a3b8;border-radius:2mm;background:#f1f5f9;color:#64748b;" +
  "font:600 9pt system-ui,sans-serif;font-style:normal}"

/** Önizleme: imza satırının üstüne "imza buraya" kutusu (imza atılınca yerini imza alır). */
export function markSignSlot(html, label) {
  if (!canSignHtml(html)) return html
  const text = String(label).replace(/[<>&"]/g, "")
  return injectCss(
    html.replace(SLOT_RE, (m) => m.replace("<div>", `<div class="tyro-slot"><i>${text}</i>`)),
    SLOT_CSS,
  )
}

/**
 * PDF'e çevrilecek hâl: kâğıt görünümü, ekran süsleri yok.
 *
 * Bölüm başlıkları CSS ile büyük harfe çevriliyor; tarayıcı bunu belgenin
 * diline göre yapıyor ama PDF çizicisi yapmıyor ("İzin" → "İZIN"). Başlıklar
 * burada belgenin diliyle önceden büyütülür, CSS dönüşümü kapatılır.
 */
export function pdfReadyHtml(html) {
  const lang = String(html).match(/<html[^>]*\slang="([^"]+)"/)?.[1] || "tr"
  const upper = html.replace(
    /<h2>([^<]*)<\/h2>/g,
    (_, text) => `<h2>${text.toLocaleUpperCase(lang)}</h2>`,
  )
  return injectCss(upper, `${pdfCss(isPortraitForm(html))}h2{text-transform:none!important}`)
}

const TR_ASCII = {
  ç: "c",
  ğ: "g",
  ı: "i",
  İ: "I",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "C",
  Ğ: "G",
  Ö: "O",
  Ş: "S",
  Ü: "U",
}

/**
 * Dosya adında sicil numarası yerine ad soyad: alan kişi sicili bilmez, adı tanır.
 * `Izin_Formu_7762_2026-09-16.html` → `Izin_Formu_Omer_Gumus_2026-09-16.html`;
 * `Masraf_Formu_EXP-12.html` → `Masraf_Formu_Omer_Gumus_EXP-12.html` (masraf no kalır).
 * Ad ASCII'ye çevrilir (eki her posta istemcisi aynı adla göstersin). Tanınmayan ad olduğu gibi.
 */
export function personalFileName(name, person) {
  const who = String(person || "")
    .trim()
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => TR_ASCII[c])
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  const s = String(name || "")
  if (!who) return s
  if (/^Izin_Formu_/i.test(s)) return s.replace(/^(Izin_Formu)_[^_]+_/i, (_, k) => `${k}_${who}_`)
  if (/^Masraf_Formu_/i.test(s)) return s.replace(/^(Masraf_Formu)_/i, (_, k) => `${k}_${who}_`)
  return s
}

/** `<title>` metni (posta konusu ve PDF başlığı için). */
export function formTitleOf(html) {
  const raw = String(html).match(/<title>([^<]*)<\/title>/)?.[1] ?? ""
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .trim()
}

/** `Izin_Formu_7762_2025-10-05.html` → `Izin_Formu_7762_2025-10-05_imzali.pdf` */
export function signedPdfName(name) {
  const base = String(name || "Form").replace(/\.[^.]+$/, "") || "Form"
  return `${base}_imzali.pdf`
}

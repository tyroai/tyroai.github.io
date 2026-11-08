import { extOf } from "@/lib/driveItem"
import { matchesDate } from "@/lib/filesDates"
import { familyOfExt } from "@/lib/filesTypes"
import { fold } from "@/lib/fold"

/**
 * Dosyalarım › E-posta ekleri (saf). Ekler posta kutusunda durur, OneDrive'da değil: son
 * `ATTACHMENTS_DAYS` günün ekli postaları (bütün klasörler) `ATTACHMENTS_PAGE`'lik sayfalarla.
 * Yalnız gerçek dosya ekleri: gövdeye gömülü resimler (imza, logo, sosyal ikon — `embeddedImage`)
 * ve öğe ekleri (iletilen posta) düşer.
 */

export const ATTACHMENTS_PAGE = 50
export const ATTACHMENTS_DAYS = 180
export const MAIL_SCOPES = ["Mail.Read"]

const FILE = "#microsoft.graph.fileAttachment"

// Gövdeye gömülü resimler (imza, logo, sosyal ikon) Graph'ta çoğu kez `isInline: false` gelir
// (özellikle "Outlook-xxxx.png" ve "image001.png"), bu yüzden bayrağa güvenilmez: resim EKİN
// kendi boyu ve adı da bakılır. Gerçek resim ekleri (fotoğraf, ekran görüntüsü, tarama) büyüktür
// ve istemcinin verdiği otomatik adı taşımaz.
const IMAGE_EXT = /\.(png|jpe?g|gif|bmp|webp|tiff?)$/i
const isImage = (a) => /^image\//i.test(a.contentType ?? "") || IMAGE_EXT.test(a.name ?? "")
// Posta istemcilerinin verdiği otomatik adlar: image001.png, Outlook-abc12.png, ~WRD0001.jpg,
// ATT00001.png, clip_image002.png, GUID.png.
const AUTO_NAME =
  /^(image\d*|outlook-[\w-]+|~wrd\d+|att\d+|clip_image\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.\w+$/i
const SIGNATURE_NAME =
  /^(logo|signature|imza|banner|footer|header|spacer|pixel|facebook|linkedin|twitter|instagram|youtube|whatsapp)[\w-]*\.\w+$/i
const TINY = 15000 // bu boyun altındaki resim dosya değildir
const AUTO_MAX = 250000 // otomatik adlı resim bu boyun altındaysa imza grafiğidir
const SIGNATURE_MAX = 60000 // imza adlı resim bu boyun altındaysa

/** Gövdeye gömülü resim mi (imza, logo, ikon): dosya eki sayılmaz. */
export function embeddedImage(a) {
  if (!isImage(a)) return false
  const size = a.size ?? 0
  const name = String(a.name ?? "").trim()
  if (size < TINY) return true
  if (AUTO_NAME.test(name) && size < AUTO_MAX) return true
  return SIGNATURE_NAME.test(name) && size < SIGNATURE_MAX
}

/** İlk sayfanın yolu (`now`dan geriye `ATTACHMENTS_DAYS` gün, yeniden eskiye). */
export function attachmentsPath(now = new Date()) {
  const since = new Date(now.getTime() - ATTACHMENTS_DAYS * 86400000).toISOString()
  const params = new URLSearchParams({
    // `$orderby` kolonu `$filter`de ilk sırada olmalı (Graph kuralı).
    $filter: `receivedDateTime ge ${since} and hasAttachments eq true`,
    $orderby: "receivedDateTime desc",
    $top: String(ATTACHMENTS_PAGE),
    $select: "id,subject,from,receivedDateTime,webLink",
    $expand: "attachments($select=id,name,size,contentType,isInline)",
  })
  return `/me/messages?${params.toString()}`
}

/** Postalar → ekler `[{ key, messageId, attachmentId, name, ext, size, subject, from, received, webLink }]`. */
export function attachmentsFromMessages(messages) {
  const out = []
  for (const m of messages ?? []) {
    for (const a of m.attachments ?? []) {
      const name = String(a.name ?? "").trim()
      if (a["@odata.type"] !== FILE || a.isInline || embeddedImage(a) || !name) continue
      out.push({
        key: `${m.id}::${a.id}`,
        messageId: m.id,
        attachmentId: a.id,
        name,
        ext: extOf(name),
        contentType: a.contentType ?? "",
        size: a.size ?? null,
        subject: String(m.subject ?? "").trim(),
        from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || "",
        received: m.receivedDateTime ?? null,
        // Gün grupları (`groupByDay`) dosyalarınkiyle aynı alanı okur.
        modified: m.receivedDateTime ?? null,
        webLink: m.webLink ?? null,
      })
    }
  }
  return out
}

/** Arama (ad, konu, gönderen), tür ve tarih filtresi — Dosyalarım'ın filtreleriyle aynı değerler. */
export function filterAttachments(
  list,
  { text = "", types = [], date = "" } = {},
  now = Date.now(),
) {
  const needle = fold(text)
  return (list ?? []).filter(
    (a) =>
      (!types.length || types.includes(familyOfExt(a.ext))) &&
      matchesDate(a.received, date, now) &&
      (!needle || fold(`${a.name} ${a.subject} ${a.from}`).includes(needle)),
  )
}

/** Ekin içeriğinin yolu (`$value` ham dosya). */
export const attachmentValuePath = (a) =>
  `/me/messages/${encodeURIComponent(a.messageId)}/attachments/${encodeURIComponent(a.attachmentId)}/$value`

const time = (iso) => Date.parse(iso ?? "") || 0

// Devamı olan kaynağın yüklenen en eski tarihi; kaynak bittiyse sınır yok.
const floorOf = (list, more) =>
  more && list.length ? Math.min(...list.map((x) => time(x.modified))) : -Infinity

/**
 * "Tümü"nün zaman çizgisi: dosyalar ve e-posta ekleri tarihe göre tek listede (ekler
 * `kind: "attachment"`). İki kaynak ayrı sayfalanır; liste, devamı olan kaynakların yüklenen en
 * yeni "en eski" tarihinde kesilir (`cut`): sonra gelen sayfa listenin ortasına girmez, altına
 * eklenir. `next` sıradaki sayfanın kaynağı — kesimi belirleyen ("files" | "mail" | null).
 */
export function mergeTimeline(files, attachments, { filesMore = false, mailMore = false } = {}) {
  const f = files ?? []
  const a = attachments ?? []
  const filesFloor = floorOf(f, filesMore)
  const mailFloor = floorOf(a, mailMore)
  const cut = Math.max(filesFloor, mailFloor)
  const items = [
    ...f.filter((x) => time(x.modified) >= cut),
    ...a.filter((x) => time(x.modified) >= cut).map((x) => ({ ...x, kind: "attachment" })),
  ].sort((x, y) => time(y.modified) - time(x.modified))
  const next =
    filesMore && (!mailMore || filesFloor >= mailFloor) ? "files" : mailMore ? "mail" : null
  return { items, cut, next }
}

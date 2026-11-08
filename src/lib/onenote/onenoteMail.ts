/**
 * OneNote sayfasını E-POSTANIN GÖVDESİ olarak hazırlar (okuyucunun "E-postayla gönder"i): alıcının
 * deftere erişimi yok, bağlantı işe yaramaz; notun kendisi biçimiyle okunur şekilde postaya girer.
 * Saf (DOM ayrıştırıcısı dışında bağımlılık yok): testli (`tests/unit/onenoteMail.test.ts`).
 *
 * - Güvenli sadeleştirme: betik, çerçeve, form, ek nesne ve `on…` öznitelikleri atılır; yalnız
 *   http(s)/mailto bağlantısı kalır; satır içi stilden yalnız yazı biçimi geçer (konum, boyut kutusu
 *   düşer: posta istemcisinde taşar).
 * - Görseller (sayfadaki gömülü `data:` görseller) gömülü ek olur (`cid:`): posta istemcileri
 *   `data:` adresini çoğunlukla göstermez. Uzak (indirilememiş) görsel alıcıda zaten açılmaz, atılır.
 *   Görsel sayısı ve toplam boyut sınırlı (Graph'ın tek istek sınırı ~4 MB).
 * - Yapılacak etiketi ☐/☑ olarak yazılır (stil sayfası olmadan görünür kalsın).
 */

export const MAX_INLINE_IMAGES = 8
/** Gömülü görsellerin toplam ham boyutu (bayt). */
export const MAX_INLINE_BYTES = 2.5 * 1024 * 1024

export interface MailAttachment {
  "@odata.type": "#microsoft.graph.fileAttachment"
  name: string
  contentType: string
  contentBytes: string
  contentId: string
  isInline: true
}

export interface NoteMail {
  html: string
  attachments: MailAttachment[]
  /** Sınır yüzünden ya da uzak olduğu için posta gövdesine girmeyen görsel sayısı. */
  droppedImages: number
}

type T = (key: string, params?: Record<string, string | number>) => string

const DROP =
  "script,style,iframe,object,embed,link,meta,form,input,button,textarea,select,svg,video,audio"
const SAFE_STYLE = new Set([
  "color",
  "background-color",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "font-size",
])

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Kişinin yazdığı not: kaçırılmış, satır sonları korunur. */
export function messageHtml(message: string): string {
  const text = message.trim()
  if (!text) return ""
  return `<p style="margin:0 0 14px 0">${escapeHtml(text).replace(/\r?\n/g, "<br>")}</p>`
}

function safeStyle(value: string): string {
  return value
    .split(";")
    .map((d) => d.trim())
    .filter((d) => {
      const name = d.split(":")[0]?.trim().toLowerCase()
      return Boolean(name) && SAFE_STYLE.has(name) && !/url\(|expression\(/i.test(d)
    })
    .join("; ")
}

const IMAGE = /^data:(image\/(?:png|jpe?g|gif|bmp|webp));base64,([A-Za-z0-9+/=\s]+)$/i
const EXT: Record<string, string> = {
  png: "png",
  jpeg: "jpg",
  jpg: "jpg",
  gif: "gif",
  bmp: "bmp",
  webp: "webp",
}

export function noteMail({
  title,
  crumb,
  html,
  message = "",
  t,
}: {
  title: string
  crumb: string
  html: string
  message?: string
  t: T
}): NoteMail {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
  doc.querySelectorAll(DROP).forEach((el) => el.remove())

  const attachments: MailAttachment[] = []
  let bytes = 0
  let dropped = 0
  doc.querySelectorAll("img").forEach((img) => {
    const m = IMAGE.exec(img.getAttribute("src") ?? "")
    const raw = m ? m[2].replace(/\s/g, "") : ""
    const size = Math.floor((raw.length * 3) / 4)
    if (!m || attachments.length >= MAX_INLINE_IMAGES || bytes + size > MAX_INLINE_BYTES) {
      dropped++
      img.remove()
      return
    }
    bytes += size
    const type = m[1].toLowerCase()
    const cid = `onenote-img-${attachments.length + 1}`
    attachments.push({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: `${cid}.${EXT[type.split("/")[1]] ?? "png"}`,
      contentType: type,
      contentBytes: raw,
      contentId: cid,
      isInline: true,
    })
    for (const a of [...img.attributes]) if (a.name !== "alt") img.removeAttribute(a.name)
    img.setAttribute("src", `cid:${cid}`)
    img.setAttribute("style", "max-width:100%;height:auto;border-radius:6px")
  })

  doc.querySelectorAll("[data-tag]").forEach((el) => {
    const tag = el.getAttribute("data-tag") ?? ""
    if (tag.startsWith("to-do"))
      el.prepend(doc.createTextNode(/completed|checked/.test(tag) ? "☑ " : "☐ "))
  })

  doc.body.querySelectorAll("*").forEach((el) => {
    for (const a of [...el.attributes]) {
      const name = a.name.toLowerCase()
      if (name === "style") {
        const kept = safeStyle(a.value)
        if (kept) el.setAttribute("style", kept)
        else el.removeAttribute("style")
      } else if (name === "href") {
        if (!/^(https?:|mailto:)/i.test(a.value.trim())) el.removeAttribute("href")
        else {
          el.setAttribute("target", "_blank")
          el.setAttribute("rel", "noopener noreferrer")
        }
      } else if (!["src", "alt", "colspan", "rowspan", "dir", "lang"].includes(name)) {
        el.removeAttribute(a.name)
      }
    }
  })

  // Sayfanın ilk satırı çoğu kez başlığın kendisi: başlık bloğu zaten yazıyor, ikinci kez yazılmaz.
  // OneNote içeriği sarmalayıcı div'lerle gelir: ilk YAPRAK bloğa inilir.
  let first = doc.body.firstElementChild
  while (first && first.tagName === "DIV" && first.firstElementChild)
    first = first.firstElementChild
  if (first && first.textContent?.trim() === title.trim()) first.remove()

  const body = doc.body.innerHTML.trim()
  const out = [
    `<div style="font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:14px;line-height:1.55;color:#1f2328">`,
    messageHtml(message),
    `<div style="border-left:3px solid #c9d1d9;padding:2px 0 2px 16px;margin:0 0 16px 0">`,
    crumb
      ? `<div style="font-size:12px;color:#6b7280;margin-bottom:2px">${escapeHtml(crumb)}</div>`
      : "",
    `<div style="font-size:20px;font-weight:600;margin:0 0 10px 0">${escapeHtml(title)}</div>`,
    body,
    `</div>`,
    `<div style="font-size:12px;color:#8c959f">${escapeHtml(t("onenote.mail.footer"))}</div>`,
    `</div>`,
  ].join("")
  return { html: out, attachments, droppedImages: dropped }
}

/** Gönderme penceresindeki önizleme: `cid:` ekler yerine `data:` — alıcının göreceğinin aynısı. */
export function previewHtml(mail: NoteMail): string {
  const byId = new Map(mail.attachments.map((a) => [a.contentId, a]))
  return mail.html.replace(/cid:(onenote-img-\d+)/g, (whole, id: string) => {
    const a = byId.get(id)
    return a ? `data:${a.contentType};base64,${a.contentBytes}` : whole
  })
}

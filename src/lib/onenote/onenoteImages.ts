/**
 * OneNote sayfasındaki görseller. Graph içerikte görseli belirteç isteyen kaynak adresiyle yazar:
 *
 *   <img src="https://graph.microsoft.com/v1.0/users('…')/onenote/resources/0-…!1-…/$value"
 *        data-src-type="image/png" data-fullres-src="…/resources/…/$value"
 *        data-fullres-src-type="image/png" width="624" height="351" alt="…">
 *
 * Sahip kısmı hesaba göre değişir: `me`, `users('id')`, `users/id`, `groups/…`, `sites/…`,
 * `siteCollections/…/sites/…`. `src` web boyutu, `data-fullres-src` asıl dosya; ilki inmezse
 * ikincisi denenir. Okuyucu indirip `data:` olarak geri koyar (çerçeve dışarıdan görsel çekmez);
 * inemeyen yer tutucu kutu olur. Saf: testli (`tests/unit/onenoteImages.test.ts`).
 */

const decodeAttr = (s: string) =>
  s
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&(#39|#x27|apos);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")

const RESOURCE_PATH = /^\/(v1\.0|beta)\/(?:[^/]+\/)*onenote\/resources\/[^/]+\/(\$value|content)$/i

/**
 * Görselin Graph kaynak adresi mi — belirteç YALNIZ bu adrese gider: https, tam olarak
 * `graph.microsoft.com` (alt alan, kullanıcı adı, port yok), yol `…/onenote/resources/{id}/$value`.
 * Ayrıştırıcı `..` ve `%2e%2e`yi çözer: yol sonradan başka uca kaçamaz.
 */
export function isGraphResource(url: string): boolean {
  if (typeof url !== "string" || !/^https:/i.test(url.trim())) return false
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return false
  }
  return (
    u.protocol === "https:" &&
    u.hostname.toLowerCase() === "graph.microsoft.com" &&
    !u.port &&
    !u.username &&
    !u.password &&
    RESOURCE_PATH.test(u.pathname)
  )
}

/** Etiketteki bir özniteliğin değeri (çözülmüş) ya da `null`. */
function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i")
  const m = re.exec(tag)
  return m ? decodeAttr((m[1] ?? m[2] ?? m[3] ?? "").trim()) : null
}

export interface ImageRef {
  /** Değiştirme anahtarı: etiketteki `src` (yoksa `data-fullres-src`). */
  key: string
  /** Denenecek Graph adresleri, sırayla (web boyutu, sonra asıl dosya). */
  urls: string[]
  /** Graph'ın bildirdiği tür (`data-src-type`); yanıt türsüz gelirse yedek. */
  type: string | null
}

const IMG = /<img\b[^>]*>/gi

/** Gövdedeki indirilecek görseller (sırayla, tekrarsız; en çok `max`). */
export function imageRefs(html: string, max = 8): ImageRef[] {
  const out: ImageRef[] = []
  for (const [tag] of html.matchAll(IMG)) {
    if (out.length >= max) break
    const src = attr(tag, "src") ?? ""
    const full = attr(tag, "data-fullres-src") ?? ""
    const urls = [...new Set([src, full].filter(isGraphResource))]
    const key = src || full
    if (!urls.length || out.some((r) => r.key === key)) continue
    out.push({ key, urls, type: attr(tag, "data-src-type") ?? attr(tag, "data-fullres-src-type") })
  }
  return out
}

/** Eski ad: yalnız adresler (ilk aday). */
export const imageSources = (html: string, max = 8): string[] =>
  imageRefs(html, max).map((r) => r.urls[0])

/**
 * İndirilen görselleri yerine koyar (`anahtar → data:`). Yerine konanın `data-fullres-src`i ve
 * `srcset`i düşer (çerçeve zaten çekmez; boşuna adres taşımasın). Eşleşmeyen dokunulmaz.
 */
export function swapImages(html: string, images: ReadonlyMap<string, string>): string {
  if (!images.size) return html
  return html.replace(IMG, (tag) => {
    const key = attr(tag, "src") || attr(tag, "data-fullres-src") || ""
    const hit = images.get(key)
    if (!hit) return tag
    const bare = tag.replace(
      /\s(src|srcset|data-fullres-src)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+)/gi,
      "",
    )
    return bare.replace(/<img\b/i, `<img src="${hit}"`)
  })
}

const escapeText = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const px = (v: string | null) => {
  const n = v ? Number.parseFloat(v) : Number.NaN
  return Number.isFinite(n) && n > 0 && !/%/.test(v ?? "") ? Math.round(n) : 0
}

/**
 * İndirilemeyen görseli yer tutucu kutuya çevirir: görselin oranında, başlığı (alt) ya da
 * `label` yazar. Açıkça küçük (< 16 px) olan süs/simge sessizce düşer. `data:` dokunulmaz.
 * Döner: yeni gövde ve kutu sayısı (dipnot için).
 */
export function placeholdImages(html: string, label: string): { html: string; missing: number } {
  let missing = 0
  const out = html.replace(IMG, (tag) => {
    if (/^data:image\//i.test(attr(tag, "src") ?? "")) return tag
    const w = px(attr(tag, "width"))
    const h = px(attr(tag, "height"))
    if ((w && w < 16) || (h && h < 16)) return ""
    missing += 1
    const text = escapeText(attr(tag, "alt") || label)
    const box = w && h ? ` style="width:${w}px;aspect-ratio:${w} / ${h}"` : ""
    return `<span class="on-img-missing" role="img" aria-label="${text}"${box}><span>${text}</span></span>`
  })
  return { html: out, missing }
}

/** Çerçevenin çizebildiği görsel türleri (EMF, TIFF gibi tarayıcının açamadıkları dışarıda). */
const DRAWABLE = /^image\/(png|jpe?g|gif|webp|bmp|avif|svg\+xml)$/i

/**
 * Baytların gerçek türü — Graph kaynağı türü `application/octet-stream` diye de yollayabiliyor;
 * imza okunur, bildirilen tür ancak çizilebilirse yedek olur. Tanınmazsa `null`.
 */
export function sniffImageType(bytes: Uint8Array, declared?: string | null): string | null {
  const b = (i: number) => bytes[i] ?? -1
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png"
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg"
  if (b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x38) return "image/gif"
  if (b(0) === 0x52 && b(1) === 0x49 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42)
    return "image/webp"
  if (b(0) === 0x42 && b(1) === 0x4d) return "image/bmp"
  const type = (declared ?? "").split(";")[0].trim().toLowerCase()
  return DRAWABLE.test(type) ? type.replace("image/jpg", "image/jpeg") : null
}

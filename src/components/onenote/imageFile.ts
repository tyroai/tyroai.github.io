/**
 * Düzenleyiciye eklenen resim dosyası → OneNote'a gidecek `data:` adresi. Telefon fotoğrafı
 * (4000 px, 3–8 MB) en uzun kenarı 1600 px olacak biçimde küçültülür ve JPEG'e çevrilir: istek
 * hızlı kalır, sayfada net görünür. Küçük PNG/GIF olduğu gibi gider (saydamlık, animasyon kalsın).
 */

const LONG_EDGE = 1600
/** Gönderilecek tek resmin üst sınırı (base64 ile ~5.3 MB istek). */
const MAX_BYTES = 4 * 1024 * 1024
const KEEP_AS_IS = /^image\/(png|gif|webp)$/
const KEEP_MAX = 1.5 * 1024 * 1024

export type PreparedImage =
  | { ok: true; src: string; width: number; height: number; alt: string }
  | { ok: false; reason: "type" | "size" | "read" }

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

/** Dosya adından görünür ad (uzantısız); ekran okuyucu ve OneNote `alt`ı için. */
const altOf = (name: string) => name.replace(/\.[a-z0-9]+$/i, "").slice(0, 120)

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!/^image\//.test(file.type)) return { ok: false, reason: "type" }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { ok: false, reason: "read" }
  }
  const { width, height } = bitmap
  const alt = altOf(file.name || "")
  try {
    const fits = Math.max(width, height) <= LONG_EDGE
    if (fits && KEEP_AS_IS.test(file.type) && file.size <= KEEP_MAX)
      return { ok: true, src: await readAsDataUrl(file), width, height, alt }
    const scale = Math.min(1, LONG_EDGE / Math.max(width, height))
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return { ok: false, reason: "read" }
    // JPEG'de saydam alan siyah olmasın.
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bitmap, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85))
    if (!blob) return { ok: false, reason: "read" }
    if (blob.size > MAX_BYTES) return { ok: false, reason: "size" }
    return { ok: true, src: await readAsDataUrl(blob), width: w, height: h, alt }
  } catch {
    return { ok: false, reason: "read" }
  } finally {
    bitmap.close()
  }
}

/** Panodan ya da sürüklemeden gelen dosyalardan resimler. */
export const imageFiles = (list: FileList | null | undefined): File[] =>
  Array.from(list ?? []).filter((f) => /^image\//.test(f.type))

/** Yapıştırma: resim dosyası varsa resim olarak eklenir, yoksa düz yazı (biçim taşınmaz). */
export function pasteInto(
  e: { preventDefault: () => void; clipboardData: DataTransfer },
  onImages: (files: File[], id: string | null) => void,
  id: string | null,
) {
  e.preventDefault()
  const files = imageFiles(e.clipboardData.files)
  if (files.length) onImages(files, id)
  else document.execCommand("insertText", false, e.clipboardData.getData("text/plain"))
}

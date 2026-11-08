/**
 * Küçük ZIP okuyucu (yalnız okuma). Office dosyaları (docx, xlsx, pptx) birer ZIP'tir; ek
 * önizlemesi (`lib/ooxml*`) içindeki XML'leri buradan okur. Merkezi dizinden girdileri listeler;
 * sıkıştırma "saklı" (0) ve "deflate" (8, tarayıcının `DecompressionStream`i). Şifreli, ZIP64 ve
 * bozuk dosyada hata atar (çağıran "önizleme yok" der). Açılmış bayt `ENTRY_MAX`'ı aşan girdi
 * okunmaz (sıkıştırma bombası).
 */
export const ENTRY_MAX = 25 * 1024 * 1024

const EOCD = 0x06054b50
const CENTRAL = 0x02014b50
const LOCAL = 0x04034b50

export async function openZip(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (view.getUint32(i, true) === EOCD) {
      end = i
      break
    }
  }
  if (end < 0) throw new Error("zip")
  const count = view.getUint16(end + 10, true)
  let at = view.getUint32(end + 16, true)
  if (count === 0xffff || at === 0xffffffff) throw new Error("zip64")

  const entries = new Map()
  const utf8 = new TextDecoder()
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== CENTRAL) throw new Error("zip")
    const nameLen = view.getUint16(at + 28, true)
    const extraLen = view.getUint16(at + 30, true)
    const commentLen = view.getUint16(at + 32, true)
    entries.set(utf8.decode(bytes.subarray(at + 46, at + 46 + nameLen)), {
      flags: view.getUint16(at + 8, true),
      method: view.getUint16(at + 10, true),
      csize: view.getUint32(at + 20, true),
      usize: view.getUint32(at + 24, true),
      offset: view.getUint32(at + 42, true),
    })
    at += 46 + nameLen + extraLen + commentLen
  }

  /** Girdinin açılmış baytları; girdi yoksa null. */
  async function read(name) {
    const e = entries.get(name)
    if (!e) return null
    if (e.flags & 1) throw new Error("encrypted")
    if (e.usize > ENTRY_MAX) throw new Error("large")
    if (view.getUint32(e.offset, true) !== LOCAL) throw new Error("zip")
    const start =
      e.offset + 30 + view.getUint16(e.offset + 26, true) + view.getUint16(e.offset + 28, true)
    const data = bytes.subarray(start, start + e.csize)
    if (e.method === 0) return data
    if (e.method !== 8) throw new Error("method")
    const inflated = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
    return new Uint8Array(await new Response(inflated).arrayBuffer())
  }

  return {
    names: [...entries.keys()],
    has: (name) => entries.has(name),
    read,
    /** Girdinin UTF-8 metni; girdi yoksa null. */
    async text(name) {
      const data = await read(name)
      return data ? utf8.decode(data) : null
    },
  }
}

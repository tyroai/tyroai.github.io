/**
 * Düzenleyicide eklenen resimler → Graph komutları (testli: `tests/unit/onenoteEdit.test.ts`).
 *
 * Resim isteğin içinde `data:` adresi olarak gider (Graph dış adresten indirmez; JSON gövdede
 * `image-data-url` destekli, çok parçalı istek gerekmez). Var olan bir öğenin altına eklenen resim
 * o öğeye `insert` · `after` ile kardeş olur; madde satırında liste bölünmesin diye listenin
 * altına. Komutlar öğe değişikliklerinden ÖNCE gider: `replace` edilen öğenin kimliği değişebilir.
 */
import type { EditableDoc } from "./onenoteEdit"

/** Görüntüde en geniş hâli (px): telefon fotoğrafı sayfayı taşırmasın, retina'da net kalsın. */
const SHOW_MAX = 800
const DATA_URL = /^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i

export interface ImageInsert {
  /** Altına eklenecek öğenin kimliği. */
  after: string
  src: string
  width: number
  height: number
  alt?: string
}

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** OneNote'a gidecek `<img>`; yalnız resim türünde `data:` adresi (başka her şey `null`). */
export function imageTag(src: string, width: number, height: number, alt = ""): string | null {
  if (!DATA_URL.test(src) || !(width > 0) || !(height > 0)) return null
  const w = Math.min(Math.round(width), SHOW_MAX)
  const h = Math.max(1, Math.round((height * w) / width))
  return `<img src="${src}" alt="${escapeAttr(alt)}" width="${w}" height="${h}" />`
}

/**
 * Eklenen resimlerin komutları. Aynı öğenin altına birden çok resim eklendiyse sıra korunur
 * (her `insert after` hedefin hemen altına girdiği için ters sırayla gönderilir).
 */
export function insertCommands(doc: EditableDoc, inserts: ImageInsert[]) {
  const byId = new Map(doc.blocks.filter((b) => b.id).map((b) => [b.id as string, b]))
  const out: { target: string; action: "insert"; position: "after"; content: string }[] = []
  for (const ins of [...inserts].reverse()) {
    const block = byId.get(ins.after)
    const content = imageTag(ins.src, ins.width, ins.height, ins.alt)
    if (!block || !content) continue
    const target = block.tag === "li" ? block.listId : block.id
    if (target) out.push({ target, action: "insert", position: "after", content })
  }
  return out
}

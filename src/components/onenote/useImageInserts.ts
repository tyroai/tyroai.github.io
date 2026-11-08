import { useCallback, useState } from "react"
import { notify } from "@/lib/notify"
import { imageTag } from "@/lib/onenote/onenoteImageInsert"
import type { ImageInsert } from "@/lib/onenote/onenoteImageInsert"
import { prepareImage } from "./imageFile"
import { placeCaret } from "./richText"

export type PendingImage = ImageInsert & { key: string }

export interface ImageTarget {
  where: "block" | "new" | null
  id: string | null
}

interface Options {
  area: { current: HTMLElement | null }
  /** Klavye/dosya penceresinden sonra odağı ve seçimi "Not ekle" alanına geri verir. */
  refocus: () => boolean
  onChange: () => void
  t: (key: string) => string
}

let seq = 0

/**
 * Düzenleyicide resim ekleme: var olan öğenin altına (kayıtta `insert`, önizleme öğenin altında,
 * kaldırılabilir) ya da "Not ekle" alanına (imlecin yerine `<img>`, notla birlikte sona eklenir).
 * Dosya önce küçültülür (`imageFile`); hedef seçilmemişse resim "Not ekle"nin sonuna girer.
 */
export function useImageInserts({ area, refocus, onChange, t }: Options) {
  const [images, setImages] = useState<PendingImage[]>([])

  const add = useCallback(
    async (files: File[], target: ImageTarget) => {
      for (const file of files) {
        const img = await prepareImage(file)
        if (!img.ok) {
          notify.error(t(`onenote.edit.image.${img.reason}`))
          continue
        }
        if (target.where === "block" && target.id) {
          const after = target.id
          setImages((list) => [...list, { ...img, after, key: `img-${++seq}` }])
        } else {
          const el = area.current
          const html = imageTag(img.src, img.width, img.height, img.alt)
          if (!el || !html) continue
          if (target.where !== "new" || !refocus()) {
            el.focus()
            placeCaret(el, null)
          }
          document.execCommand("insertHTML", false, html)
        }
        onChange()
      }
    },
    [area, refocus, onChange, t],
  )

  const remove = useCallback(
    (key: string) => setImages((list) => list.filter((i) => i.key !== key)),
    [],
  )

  return { images, add, remove }
}

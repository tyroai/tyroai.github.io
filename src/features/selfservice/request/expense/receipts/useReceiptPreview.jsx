import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatFileSize } from "@/features/chat/composerFiles"
import { ImageLightbox } from "@/components/common/ImageLightbox"
import { isCompressibleImage } from "@/lib/copilot"

/**
 * Fişin önizlemesi (başlığın fiş şeridi; gözden geçirmede de kullanılabilir). Görsel uygulamanın
 * ışık kutusunda açılır (`ImageLightbox`: oklarla fişler arasında gezilir, Escape yalnız onu
 * kapatır, odak açan düğmeye döner). PDF ve tarayıcının gösteremediği görsel (masaüstü
 * Chrome'da HEIC) yeni sekmede: `FilePreviewDialog` Graph dosyası içindir, yerel dosyayı açamaz.
 * Sekmenin adresi fiş başına bir kez üretilir, bileşen kalkınca (form kapanınca) bırakılır.
 * Işık kutusunda yakınlaştırma hep açık (fişin küçük yazısı okunsun); `onRotate(id, ±90)` verilirse
 * döndürme de — yalnız gönderimde gerçekten döndürülebilen görselde (`isCompressibleImage`:
 * küçültülen raster görsel; HEIC/GIF olduğu gibi gider, döndürmesi kaybolurdu). Gözden geçirmede
 * verilmez: gönderilecek dosyalar orada paketlenmiş.
 * `list`: `{ id, file, url, rotate }` fişler. Dönüş: `open(fiş, düğme)` (odağın döneceği düğme;
 * verilmezse odaktaki öğe), `inTab(fiş)` (yeni sekmede mi açılır),
 * `markBroken(id)` (küçük resim çizilemedi) ve çizilecek `viewer`.
 */
export function useReceiptPreview(list, { onRotate } = {}) {
  const [active, setActive] = useState(null)
  // Önizlemeyi açan düğme: ışık kutusunun tetiği yok, Radix odağı kendisi geri vermiyor.
  const opener = useRef(null)
  const [broken, setBroken] = useState(() => new Set())
  // Sekmede açılan dosyaların adresleri: bir kez üretilir, bileşen kalkınca bırakılır.
  const [tabs] = useState(() => new Map())
  useEffect(
    () => () => {
      tabs.forEach((url) => URL.revokeObjectURL(url))
      tabs.clear()
    },
    [tabs],
  )

  const images = useMemo(
    () =>
      list
        .filter((f) => f.url && !broken.has(f.id))
        .map((f) => ({
          id: f.id,
          url: f.url,
          name: f.file.name,
          meta: formatFileSize(f.file.size),
          rotate: f.rotate ?? 0,
          rotatable: isCompressibleImage(f.file),
        })),
    [list, broken],
  )
  const inTab = useCallback((f) => !f.url || broken.has(f.id), [broken])
  const open = (f, from) => {
    if (!inTab(f)) {
      // Safari tıklanan düğmeye odak vermez: odağın döneceği yer basılan düğmenin kendisi.
      opener.current = from ?? document.activeElement
      return setActive(f.id)
    }
    let url = tabs.get(f.id)
    if (!url) {
      url = URL.createObjectURL(f.file)
      tabs.set(f.id, url)
    }
    window.open(url, "_blank", "noopener")
  }
  const markBroken = useCallback((id) => setBroken((s) => (s.has(id) ? s : new Set(s).add(id))), [])
  const viewer = (
    <ImageLightbox
      items={images}
      activeId={active}
      onActiveIdChange={setActive}
      onRotate={onRotate}
      zoomable
      onClose={() => {
        setActive(null)
        // Kapanan pencerenin odağı (kapat düğmesi, içerik) ile birlikte kaybolmasın.
        const back = opener.current
        requestAnimationFrame(() =>
          requestAnimationFrame(() => back?.isConnected && back.focus({ preventScroll: true })),
        )
      }}
    />
  )
  return { open, inTab, markBroken, viewer }
}

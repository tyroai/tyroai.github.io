import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { RefObject } from "react"

/**
 * Yardım kartının kutusu: genişlik, yükseklik, başlığın altı ve kök yazı boyu (`rem`; 1280 ve
 * 1440'ta küçülüyor, sahne kartının satır bütçesi ona göre). Başlık sonradan uzayabilir
 * (kutlama satırları), o da gözlenir. `sig`: dönen öneriler aynı kaldıkça başlığın en uzun hâli
 * tutulur — küre her geçişte büyüyüp küçülmesin.
 */
export interface OrbBox {
  w: number
  h: number
  sig: string
  textBottom: number
  rem: number
}

export function useOrbBox(
  hostRef: RefObject<HTMLElement | null>,
  titleRef: RefObject<HTMLElement | null>,
  sig: string,
): OrbBox | null {
  const [box, setBox] = useState<OrbBox | null>(null)
  const sigRef = useRef(sig)
  useLayoutEffect(() => {
    sigRef.current = sig
  }, [sig])

  useEffect(() => {
    const el = hostRef.current
    if (!el || typeof ResizeObserver === "undefined") return undefined
    const measure = () => {
      const title = titleRef.current
      const textBottom = title ? title.offsetTop + title.offsetHeight : 0
      const at = sigRef.current
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      setBox((prev) => ({
        w: el.offsetWidth,
        h: el.offsetHeight,
        sig: at,
        rem,
        textBottom: prev?.sig === at ? Math.max(prev.textBottom, textBottom) : textBottom,
      }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (titleRef.current) ro.observe(titleRef.current)
    return () => ro.disconnect()
  }, [hostRef, titleRef])

  return box
}

/**
 * Kutunun yüksekliği / küre çapı — iki görünüm farklı: maskotun tuvali 440×470 ve küre r=171,
 * kürenin (`PastelVoiceOrb`) kutusu halesi ve dalgasıyla kare ve ~1,78 kat.
 */
const ORB_BOX_H = { mascot: (470 / 440) * (440 / 342), sphere: 1.775 }
/** Kutunun ALTTAN ne kadarı kartın dışında kalır — gözün hemen altı. */
const ORB_HIDDEN = 0.4
/**
 * Kişinin kendi günü: pasta ve plaket gözlerin altında; doğum gününde kutunun %20'si, yıl
 * dönümünde %21'i dışarıda. Şapkanın ve balonların tuvali aşan payı çapın %22'si.
 */
const SCENE_HIDDEN: Record<string, number> = { birthday: 0.2, both: 0.2, anniversary: 0.21 }
const SCENE_TOP = 76 / 342

/** Başlık kipinde ve kutlamada kürenin çapı (öneri sahneleri kendi çapını `sceneLayout`tan alır). */
export function orbSizeFor(
  box: OrbBox | null,
  {
    view,
    scene,
    takeover,
  }: { view: "mascot" | "sphere"; scene: string | null; takeover: "install" | "colleagues" | null },
): number {
  if (!box) return 0
  // Kutlamada ve kurulumda maskot kenarda, kartı uzatan köşede: boy genişliğe göre. Kurulumda bir
  // kademe büyük (ürün sahibi): kartın dibinde yer var, düğmeler başta.
  if (takeover === "install") return Math.round(Math.min(128, box.w * 0.44))
  if (takeover) return Math.round(Math.min(108, box.w * 0.36))
  const hidden = scene ? SCENE_HIDDEN[scene] : ORB_HIDDEN
  const topRoom = scene ? SCENE_TOP : 0
  const byWidth = box.w * (view === "mascot" ? 0.74 : 0.62)
  const byHeight = (box.h - box.textBottom - 14) / ((1 - hidden) * ORB_BOX_H[view] + topRoom)
  const floor = scene ? 84 : 96
  return Math.round(Math.max(floor, Math.min(220, byWidth, byHeight)))
}

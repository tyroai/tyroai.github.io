import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { ORB_ROTATE_MS, orbSlides } from "@/features/myspace/lib/orbSuggest"
import { useRest } from "@/lib/restMode"

/**
 * Küre kartının slaytları ve kendiliğinden geçişi: kurulum, o gün çevrede kutlama, sonra öneriler
 * (`orbSlides`). Görünen slayt TÜRÜYLE tutulur, sıra numarasıyla değil: takvim ya da Keşfet sonradan
 * gelip listeye öneri ekleyince (ya da biri düşünce) görünen kart yerinde kalır; türü düşerse aynı
 * sıradaki gelir. Birden çok slayt varsa `ORB_ROTATE_MS`de bir sıradakine geçer; kartın
 * üstündeyken ya da içinde odak varken (`hold`), dinlenme kipinde ve azaltılmış harekette durur.
 * Kartta bir şeye basan (`stop`) ya da oka basan (`next`) kişide dönüş durur: açılan menü ya da
 * okunan cümle elinden kaymasın. Sayfada kartın dışına basınca kaldığı yerden yeniden döner;
 * kartın açtığı menü, balon ve pencereler portalda — onlara basmak "dışarı" sayılmaz.
 * Oka basıldıysa slayt değişince odak yeni oka (`claimFocus`, `OrbNext` takılınca sorar): ok
 * slaytla yer değiştirir ve yeni kart eskisi çekildikten sonra gelir; klavyede odak kaybolmasın.
 */
const PORTALS =
  '[data-radix-popper-content-wrapper], [role="menu"], [role="dialog"], [role="tooltip"], [data-sonner-toaster]'

export function useOrbDeck(list, colleagues, hold, hostRef) {
  const reduce = useReducedMotion()
  const resting = useRest()
  const [cur, setCur] = useState({ kind: null, i: 0 })
  const [moved, setMoved] = useState(false)
  const [manual, setManual] = useState(false)
  const refocus = useRef(false)
  const slides = useMemo(() => orbSlides(list, colleagues), [list, colleagues])
  const n = slides.length
  const found = cur.kind ? slides.findIndex((s) => s.kind === cur.kind) : -1
  const index = !n ? 0 : found >= 0 ? found : Math.min(cur.i, n - 1)
  // Görünen slayt kaydedilir (çizim sırasında, React'ın "önceki çizimden durum" kalıbı).
  const shown = slides[index]?.kind ?? null
  if (shown !== cur.kind || index !== cur.i) setCur({ kind: shown, i: index })
  const auto = n > 1 && !manual && !hold && !resting && !reduce

  // Zamanlayıcı ve ok, o anki listeden ve görünen sıradan ilerler.
  const latest = useRef({ slides, index })
  useLayoutEffect(() => {
    latest.current = { slides, index }
  })
  const step = useCallback(() => {
    const { slides: all, index: at } = latest.current
    if (all.length < 2) return
    const i = (at + 1) % all.length
    setCur({ kind: all[i].kind, i })
    setMoved(true)
  }, [])

  useEffect(() => {
    if (!auto) return undefined
    const id = setInterval(step, ORB_ROTATE_MS)
    return () => clearInterval(id)
  }, [auto, step])

  useEffect(() => {
    if (!manual) return undefined
    const onDown = (e) => {
      const host = hostRef?.current
      if (!host || host.contains(e.target) || e.target.closest?.(PORTALS)) return
      setManual(false)
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [manual, hostRef])

  const stop = useCallback(() => setManual(true), [])
  const next = useCallback(() => {
    refocus.current = true
    setManual(true)
    step()
  }, [step])

  // Oka basıldıysa yeni slaytın oku odağı alır (`OrbNext` takılınca bir kez sorar).
  const claimFocus = useCallback(() => {
    const yes = refocus.current
    refocus.current = false
    return yes
  }, [])

  return {
    slides,
    index,
    slide: slides[index] ?? null,
    auto,
    manual,
    moved,
    stop,
    next,
    claimFocus,
  }
}

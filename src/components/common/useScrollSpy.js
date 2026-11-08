import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Sayfa içi bölüm izleyici (scroll-spy): kaydırıcıda (`scroller` DOM öğesi, durumdan: `ref` nesnesi değil —
 * derleyici kuralı ref alan kancanın dönüşünü çizimde okumayı yasaklıyor) hangi bölümün "okunduğunu" söyler.
 * `ids` belge sırasında verilir (iç içe olanda dış önce). Kaydırıcının üst %30'luk şeridine değen
 * öğelerden EN SON (en iç) olanı etkindir: başı çizginin üstüne çıkmış ama henüz geçilmemiş bölüm.
 * Hiçbiri değmiyorsa (sayfa başı) ilk kimlik. Sayfa sonunda son bölüm
 * kısa kalıp şeride varamaz: `watchEnd` (içeriğin sonundaki 1 px'lik bekçinin `ref`'i) görününce
 * son kimlik etkin olur.
 * `hold(id)`: menüden tıklanınca etkin hemen o olur, yumuşak kaydırma bitene dek izleyici susar
 * (yol üstündeki bölümler menüde yanıp sönmesin); sayfa dibinde de tıklanan bölüm üst şeritteki en son
 * bölümse tıklanan kalır (sayfa onu başa getirecek kadar uzamıyor). `enabled` kapalıysa (arama
 * sürerken) etkin `null`.
 */
export function useScrollSpy(scroller, ids, enabled = true) {
  const [active, setActive] = useState(null)
  const [endEl, setEndEl] = useState(null)
  const lock = useRef({ until: 0, timer: 0, settle: null, held: null })
  const key = ids.join("|")

  useEffect(() => {
    const root = scroller
    const list = key ? key.split("|") : []
    if (!enabled || !root || list.length === 0 || typeof IntersectionObserver === "undefined") {
      return undefined
    }
    const state = lock.current
    const live = new Set()
    let atEnd = false
    const settle = () => {
      if (performance.now() < state.until) return
      // Dipteyken son bölüm seçilir; ama menüden tıklanan bölüm üst şeritteki EN SON bölümse (sayfa
      // onu başa getirecek kadar uzamıyorsa) tıklanan kalır.
      const last = [...list].reverse().find((i) => live.has(i))
      // Şerite hiçbir şey değmiyorsa sayfa başındayız (ani atlayışta eski değer kalmasın): ilk kimlik.
      const id = atEnd && last !== state.held ? list[list.length - 1] : (last ?? list[0])
      if (id) setActive(id)
    }
    state.settle = settle
    const band = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) live.add(e.target.id)
          else live.delete(e.target.id)
        }
        settle()
      },
      { root, rootMargin: "0px 0px -70% 0px" },
    )
    for (const id of list) {
      const el = document.getElementById(id)
      if (el) band.observe(el)
    }
    const end = new IntersectionObserver(
      ([e]) => {
        atEnd = e.isIntersecting
        settle()
      },
      { root },
    )
    if (endEl) end.observe(endEl)
    return () => {
      band.disconnect()
      end.disconnect()
      state.settle = null
    }
  }, [scroller, key, enabled, endEl])

  useEffect(() => {
    const state = lock.current
    return () => window.clearTimeout(state.timer)
  }, [])

  const hold = useCallback((id, ms = 900) => {
    const state = lock.current
    state.until = performance.now() + ms
    state.held = id
    setActive(id)
    window.clearTimeout(state.timer)
    state.timer = window.setTimeout(() => state.settle?.(), ms + 50)
  }, [])

  return { active: enabled ? (active ?? ids[0] ?? null) : null, hold, watchEnd: setEndEl }
}

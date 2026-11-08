import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

/** Sayfa bu kadar (px) içinde hizalıysa yerine oturmuş sayılır. */
const ALIGNED = 2
/** `scrollend` olmayan tarayıcıda (eski Safari) kaydırma bu kadar (ms) durunca bitti sayılır. */
const IDLE = 120

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/** Sayfanın kaydırıcının sol kenarına uzaklığı (px). Fiziksel: sağdan sola dilde de doğru. */
function offset(scroller: HTMLElement, pane: Element): number {
  return pane.getBoundingClientRect().left - scroller.getBoundingClientRect().left
}

function paneOf(scroller: HTMLElement, id: string): HTMLElement | null {
  for (const pane of scroller.children) {
    if ((pane as HTMLElement).dataset.postId === id) return pane as HTMLElement
  }
  return null
}

/**
 * Telefon okuyucusunun yatay sayfalayıcısı: listenin BÜTÜN gönderileri sabit bir şeritte yan yana
 * (yalnız geçerli ve iki komşusu dolu, ötekiler boş yer tutucu — `PhoneReader`), kaydırma tarayıcının kendi yapışkan kaydırması (`scroll-snap`). Parmağı izleyen, momentumlu ve
 * çerçevenin (posta gövdesi, `iframe`) üstünden de çalışan tek yol bu: korumalı çerçeve dokunma
 * olayını sayfaya vermez, ama yatay kaydırmayı üst kaydırıcıya zincirler.
 * Kare başına JS yok: yalnız sayfa yerine oturunca `onSettle(id)` çağrılır (adres değişir).
 * Şerit gezinmede DEĞİŞMEZ: sayfaların yeri sabit, kaydırarak gelinen sayfa zaten yerinde.
 * Önceki sürüm her geçişte üçlüyü yeniden diziyordu; iOS Safari dizilişte kaydırmayı kendisi
 * yeniden oturtuyor, bizim ortalamamız da üstüne binince bir sayfa fazla kayıp iki gönderi arasında
 * gidip gelen bir döngüye giriyordu (2-3-2-3).
 */
export function usePostPager(
  currentId: string | null,
  layoutKey: string,
  onSettle: (id: string) => void,
) {
  // Durum, ref değil: okuyucu portalda ve kaydırıcı ilk çizimden SONRA bağlanıyor; dinleyiciler
  // ona bağlanınca kurulmalı.
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const current = useRef(currentId)
  // İstenen ama adrese henüz yansımamış gönderi: arada gelen kaydırma olayları aynı gezinmeyi
  // tekrar istemesin.
  const asked = useRef<string | null>(null)
  const settle = useRef(onSettle)
  useEffect(() => {
    settle.current = onSettle
  })

  // Yalnız gerçekten kaymışsa: kaydırarak gelinen sayfa zaten yerinde, ona dokunulmaz.
  const center = useCallback(() => {
    const pane = el && current.current ? paneOf(el, current.current) : null
    const dx = el && pane ? offset(el, pane) : 0
    if (el && Math.abs(dx) > ALIGNED) el.scrollBy({ left: dx, behavior: "instant" })
  }, [el])

  // Açılışta, düğme/klavye dışından gelen gönderide ve liste değişince geçerli sayfa yerine konur.
  // `current` bu etkiden önce güncellenmeli: etkiler sırayla koşar, yukarıdaki önce.
  useLayoutEffect(() => {
    current.current = currentId
    asked.current = null
    center()
  }, [currentId, layoutKey, center])

  useEffect(() => {
    if (!el) return undefined
    let timer = 0
    const check = () => {
      window.clearTimeout(timer)
      for (const pane of el.children) {
        if (Math.abs(offset(el, pane)) > ALIGNED) continue
        const id = (pane as HTMLElement).dataset.postId
        if (id && id !== current.current && id !== asked.current) {
          asked.current = id
          settle.current(id)
        }
        return
      }
    }
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(check, IDLE)
    }
    // Döndürme: GENİŞLİK değişince geçerli sayfa yeniden hizalanır. Boy değişimi (adres çubuğu,
    // klavye, bildirim) sayılmaz: parmak kaydırırken sayfayı yerine çekip titretiyordu.
    let width = el.clientWidth
    const resize = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      center()
    })
    resize.observe(el)
    el.addEventListener("scroll", onScroll, { passive: true })
    el.addEventListener("scrollend", check)
    return () => {
      window.clearTimeout(timer)
      resize.disconnect()
      el.removeEventListener("scroll", onScroll)
      el.removeEventListener("scrollend", check)
    }
  }, [el, center])

  /** Düğme ve klavye: komşu sayfaya kayarak gider (azaltılmış harekette anında). */
  const go = useCallback(
    (id: string) => {
      const pane = el ? paneOf(el, id) : null
      if (!el || !pane || reduced()) {
        settle.current(id)
        return
      }
      el.scrollBy({ left: offset(el, pane), behavior: "smooth" })
    },
    [el],
  )

  return { ref: setEl, go }
}

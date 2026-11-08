import { useEffect } from "react"
import { useBackToClose } from "@/hooks/useBackToClose"

// Bildirimler (sonner) ve betikler etkin kalır.
const SKIP = "script, section[aria-live], [data-sonner-toaster]"
const focusable = (el) =>
  el instanceof HTMLElement && el.isConnected && el !== document.body && !el.closest("[inert]")

/** `node` ve `keep` dışındaki her şeyi (ataların kardeşlerini) `inert` yapar; geri alan işlevi döner. */
function muteOthers(node, keep) {
  const muted = []
  for (let el = node; el.parentElement && el !== document.body; el = el.parentElement) {
    for (const sib of el.parentElement.children) {
      if (sib === el || sib === keep || sib.inert || sib.matches(SKIP)) continue
      sib.inert = true
      muted.push(sib)
    }
  }
  return () => {
    for (const el of muted) el.inert = false
  }
}

/**
 * Telefonda sohbet paneli sayfanın üstünde bir çekmece: açıkken modal davranır. Geri tuşu
 * paneli kapatır (arkadaki sayfayı geri götürmez); odak panele geçer, kapanınca açan öğeye döner.
 * Açan öğe artık yoksa (ör. gönderilen formun düğmesi) sayfanın gösterdiği dönüş yerine
 * (`data-dock-return`), o da yoksa başlıktaki sohbet düğmesine (`data-dock-toggle`). Arkadaki
 * sayfa `inert`: sekme ve ekran okuyucu panelin dışına çıkmaz. Perde (`keep`) etkin kalır.
 */
export function useDockModal(active, panel, keep, onClose) {
  useBackToClose(active, onClose)
  useEffect(() => {
    const node = panel.current
    if (!active || !node) return undefined
    const opener = document.activeElement
    const unmute = muteOthers(node, keep.current)
    if (!node.contains(document.activeElement)) node.focus({ preventScroll: true })
    return () => {
      unmute()
      // Odak başka bir yere geçtiyse (ör. tam sayfa sohbetin yazma alanı) dokunulmaz.
      const here = document.activeElement
      if (here && here !== document.body && !node.contains(here)) return
      const back = [
        opener,
        document.querySelector("[data-dock-return]"),
        document.querySelector("[data-dock-toggle]"),
      ].find(focusable)
      back?.focus({ preventScroll: true })
    }
  }, [active, panel, keep])
}

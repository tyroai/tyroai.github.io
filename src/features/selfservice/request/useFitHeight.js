import { useCallback } from "react"

// Kişinin forma başladığı anlar: bundan sonra pencere yeniden ortalanmaz.
const SETTLE = ["pointerdown", "keydown", "input", "drop"]

/**
 * Talep penceresinin doğal boyu: başlık + gövdenin bütün içeriği + alt şerit. Pencerenin kabına
 * `--fit` olarak yazılır; `requestFrame` pencereyi ilk açılışta bu boya göre ortalar — ekran
 * yetiyorsa kaydırma gerekmez. Kişi pencereye dokunana, tuşa basana, alana bir şey girene
 * (yapıştırma, otomatik doldurma) ya da dosya bırakana dek geç gelen veriyle (yönetici, takvim,
 * iki aylık takvime geçiş) yeniden ölçülür; sonra boy sabit kalır, içerik büyürse pencere yalnız
 * aşağı uzar (açılan liste, seçilen tarih içeriği kaydırmaz).
 * React durumu değil, doğrudan stil: ölçüm yeni çizim istemez, ilk karede yerindedir.
 * Dönen ref gövdenin kaydırma kabına (ilk çocuğu form) verilir — geri çağrı: Radix pencereyi
 * portala bir tur sonra koyar, efekt o anı kaçırırdı.
 */
export function useFitHeight(active) {
  return useCallback(
    (scroller) => {
      const box = scroller?.parentElement
      const inner = scroller?.firstElementChild
      if (!active || !box || !inner) return undefined
      let settled = false
      const measure = () => {
        if (settled) return
        const pad = getComputedStyle(scroller)
        const chrome = box.offsetHeight - scroller.offsetHeight
        const body = inner.offsetHeight + parseFloat(pad.paddingTop) + parseFloat(pad.paddingBottom)
        box.style.setProperty("--fit", `${Math.ceil(chrome + body)}px`)
      }
      const settle = () => {
        settled = true
      }
      measure()
      for (const type of SETTLE) box.addEventListener(type, settle, true)
      const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
      ro?.observe(inner)
      return () => {
        ro?.disconnect()
        for (const type of SETTLE) box.removeEventListener(type, settle, true)
        box.style.removeProperty("--fit")
      }
    },
    [active],
  )
}

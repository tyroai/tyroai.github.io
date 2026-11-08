import { useEffect, useLayoutEffect, useState } from "react"

// Özet yanda: form en az bu kadar geniş (rem).
const SIDE_FORM = 80
// Yan panel (18rem) ve kalemlerle arası (1.5rem): kalemlerin yanında bırakılan pay.
const SIDE_REM = 19.5
const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

/**
 * Özet kalemlerin yanında mı (yan panel), üstünde mi (şerit): form ≥ 80rem VE kalem tablosu
 * panelin yanına sığıyor. Tablonun en dar hâli kişinin sütunlarına bağlı (`linesRem`; kartlarda
 * 0): sütun eklenip pencere ekranla sınırlanınca tablo panelin altına taşmasın diye özet şeride
 * iner. Bu yüzden kabın sabit bir sorgusu değil, ölçüm. İlk çizimden önce ölçülür (kayma yok).
 * `node`: gövdenin kökü (formun genişliği).
 */
export function useSummarySide(node, linesRem) {
  const [side, setSide] = useState(false)
  useLayoutEffect(() => {
    if (!node) return undefined
    const check = () => {
      const width = node.clientWidth / remPx()
      setSide(width >= SIDE_FORM && width >= linesRem + SIDE_REM)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(node)
    return () => ro.disconnect()
  }, [node, linesRem])
  return Boolean(node) && side
}

/**
 * Yan panelin en çok boyu (`--summary-max`): pencere en çok uzadığında gövdede kalan yer (üst
 * sınırı ekranla sınırlı pencere; tam ekranda bugünkü boyu). Panel o boya kadar pencereyi
 * uzatır; daha uzunsa kendi içinde kayar — yapışıkken alt satırına (yönetici) tablonun sonunu
 * beklemeden ulaşılır.
 */
export function useScrollRoom(ref, on) {
  useEffect(() => {
    const el = ref.current
    const box = el?.closest(".overflow-y-auto")
    const frame = box?.closest("[role=dialog]")
    if (!on || !el || !box || !frame) return undefined
    const set = () => {
      const s = getComputedStyle(box)
      const height = frame.getBoundingClientRect().height
      const max = parseFloat(getComputedStyle(frame).maxHeight)
      const chrome = height - box.clientHeight
      const pad = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom)
      const room = (Number.isFinite(max) ? max : height) - chrome - pad
      el.style.setProperty("--summary-max", `${Math.max(Math.round(room), 240)}px`)
    }
    const ro = new ResizeObserver(set)
    ro.observe(box)
    ro.observe(frame)
    window.addEventListener("resize", set)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", set)
    }
  }, [ref, on])
}

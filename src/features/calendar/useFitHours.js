import { useLayoutEffect, useRef, useState } from "react"
import { WORK_HOURS } from "@/lib/workHours"

// Haftayı tek bakışta: mesai yarım saat payla (07:30–18:00) görünen yüksekliğe sığsın.
const FIT_FROM = WORK_HOURS.from - 0.5
const FIT_HOURS = WORK_HOURS.to - WORK_HOURS.from + 1
// Saat başı yüksekliğin sınırları (px): yarım saatlik toplantı okunur kalsın, büyük ekranda şişmesin.
const HOUR_MIN = 26
const HOUR_MAX = 56
// Rahat ölçek: saat başı sabit yükseklik, mesai sığmaz ve kaydırılır (yoğun günde her satır okunur).
const HOUR_COMFORT = 64

/**
 * Saat ızgarasının ölçeği: kaydırma kabının yapışkan başlıktan (gün adları + tüm gün satırı) arta
 * kalan yüksekliği mesaiyi tam alır; dönen saat başı px `--cal-hour` olur. Açılışta, görünüm
 * değişince ve ölçek değişince mesainin başına kaydırır; hafta gezerken yerinde kalır. Kısa
 * ekranda alt sınırda kalır, kaydırma sürer.
 */
export function useFitHours(scrollerRef, stickyRef, scrollKey, earliest = null, comfort = false) {
  const [hour, setHour] = useState(null)
  // Açılışta erken başlayan blok varsa kaydırma ondan çeyrek saat öncesine: başlığı üstte kalmasın.
  // Ref: hafta gezerken yeniden kaydırma tetiklemez.
  const from = useRef(FIT_FROM)
  useLayoutEffect(() => {
    from.current = earliest == null ? FIT_FROM : Math.min(FIT_FROM, earliest - 0.25)
  })
  useLayoutEffect(() => {
    const el = scrollerRef.current
    const head = stickyRef.current
    if (!el || !head) return
    const measure = () => {
      const avail = el.clientHeight - head.offsetHeight
      const px = comfort
        ? HOUR_COMFORT
        : Math.max(HOUR_MIN, Math.min(HOUR_MAX, Math.floor(avail / FIT_HOURS)))
      setHour((h) => (h === px ? h : px))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    ro.observe(head)
    return () => ro.disconnect()
  }, [scrollerRef, stickyRef, comfort])
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (hour && el) el.scrollTop = Math.max(0, from.current) * hour
    // Yalnız görünüm ya da ölçek değişince: hafta gezerken kaydırma yerinde kalır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey, hour])
  return hour
}

import { useEffect } from "react"

/**
 * Sağ altta yüzen bir kart (bugün toplantı geri sayımı) görünürken onun yerini sayfaya bildirir:
 * kökte `--float-stack-bottom` = kartın üst kenarının ekranın altına uzaklığı + 12 px. Aynı
 * köşedeki öteki yüzen öğeler (Self Servis'in sihirbaz değneği) `bottom`larını en az bu kadar
 * tutup kartın üstüne çıkar, altında kalmaz. Kart kalkınca değişken silinir; kartın boyu
 * (`ResizeObserver`) ya da pencere değişirse güncellenir.
 */
export function useFloatStack(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const root = document.documentElement
    const set = () => {
      const space = window.innerHeight - el.getBoundingClientRect().top + 12
      root.style.setProperty("--float-stack-bottom", `${Math.ceil(space)}px`)
    }
    set()
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(set) : null
    observer?.observe(el)
    window.addEventListener("resize", set)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", set)
      root.style.removeProperty("--float-stack-bottom")
    }
  }, [ref])
}

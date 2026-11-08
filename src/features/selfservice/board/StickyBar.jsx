import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Telefonun yapışkan şeridi (sekmeler): liste kayarken sayfanın kayan kabının tepesinde (header'ın
 * hemen altında) kalır. Kenardan kenara zemin; üst dolgu bölüm arası boşluğun yerini tutar ve
 * yapışınca header çizgisindeki çentiğin sekmesine yer bırakır. Yapışınca altına ince çizgi ve
 * gölge (`IntersectionObserver` ile; kaydırırken yeniden çizim yok). Kısa ekranda (yatay telefon)
 * yapışmaz: kayan alanın dörtte birini kaplardı.
 */
export function StickyBar({ children, className }) {
  const sentinel = useRef(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === "undefined") return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        const top = entry.rootBounds?.top ?? 0
        setStuck(!entry.isIntersecting && entry.boundingClientRect.top < top)
      },
      { root: el.closest(".ms-scroll"), threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="-mb-px h-px" />
      <div
        className={cn(
          // Yan payı sayfanın yan boşluğuyla aynı (telefon düzeni < 1024 px): zemin ekranın iki
          // kenarına uzanır.
          "sticky top-0 z-20 -mx-4 bg-background px-4 pb-2 pt-5 transition-shadow duration-200 motion-reduce:transition-none sm:-mx-8 sm:px-8 shortest:static",
          stuck && "shadow-sm",
          className,
        )}
      >
        {children}
      </div>
    </>
  )
}

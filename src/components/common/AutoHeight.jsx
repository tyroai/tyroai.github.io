import { useLayoutEffect, useRef } from "react"

/**
 * İçeriğinin boyunu yumuşakça izleyen kap: içerik değişince (görünüm değişimi, açılan liste,
 * sonradan gelen veri) kutu zıplamaz, yeni boya kayar. Boy içeriğe ölçülüp doğrudan stile yazılır
 * (kare başına React durumu yok); geçişin süresi ve eğrisi kabın CSS'inde (`transition: height`).
 * İlk ölçü geçişsizdir: kap açılırken sıfırdan büyümez. İçteki sarmalayıcı konumlu: çıkan görünüm
 * (`AnimatePresence mode="popLayout"`) ona göre yerinde solar.
 */
export function AutoHeight({ children, ref, ...rest }) {
  const outer = useRef(null)
  const inner = useRef(null)

  useLayoutEffect(() => {
    const box = outer.current
    const content = inner.current
    if (!box || !content || typeof ResizeObserver === "undefined") return undefined
    let sized = false
    const sync = () => {
      const height = content.offsetHeight
      if (!height) return
      if (sized) {
        box.style.height = `${height}px`
        return
      }
      sized = true
      box.style.transition = "none"
      box.style.height = `${height}px`
      // Geçişsiz boyu işlet, sonra geçişi geri ver.
      void box.offsetHeight
      box.style.transition = ""
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  const setOuter = (el) => {
    outer.current = el
    if (typeof ref === "function") ref(el)
    else if (ref) ref.current = el
  }
  return (
    <div ref={setOuter} {...rest}>
      <div ref={inner} style={{ position: "relative" }}>
        {children}
      </div>
    </div>
  )
}

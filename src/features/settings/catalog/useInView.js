import { useEffect, useState } from "react"

/**
 * Öğe görüntü alanında mı. Telefondaki yüzen "Yeni" yalnız katalog görünürken durur: profil
 * bölümleri tek sayfada art arda dursa da düğme başka bölümün üstünde yüzmez.
 */
export function useInView(ref) {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return undefined
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return inView
}

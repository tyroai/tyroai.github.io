import { createContext, useContext, useLayoutEffect, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMediaQuery } from "@/hooks/useMediaQuery"

/** Telefon düzeninin eşiği: kabın (`@container/ss`) genişliği, px (40rem). */
export const PHONE_MAX = 640
// Yatay telefon da telefon düzenini alır: kısa (≤ 500 px) ve kaba işaretçili ekran.
const SHORT_TOUCH = "(max-height: 500px) and (pointer: coarse)"
// Dokunmatik ekran (tablet): kap darsa telefon düzeni — dikey iPad'de kenar çubuğu açıkken kap
// 456–624 px kalıyor, masaüstü düzeni orada sıkışıyordu.
const COARSE = "(pointer: coarse)"

export const PhoneContext = createContext(false)

/** Self Servis telefon düzeninde mi — `SelfServicePage` verir (`usePhoneLayout`). */
export const usePhone = () => useContext(PhoneContext)

// Kartın düzen kırılımları, rem (kök yazı boyu akışkan): To-Do kartının aynı kaptaki kırılımları.
const HERO_MID_REM = 48
const HERO_WIDE_REM = 64
// Kısa ekran (yatay telefon, alçak pencere): To-Do'nun kartı tek sıraya iniyor (`shortest`).
const SHORT = "(max-height: 500px)"

const rootPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

/** Kabın eninden kartın kırılımı: `wide` ≥ 64rem, `mid` 48–64rem, `narrow` daha dar. */
function bandOf(width) {
  const rem = rootPx()
  return width >= HERO_WIDE_REM * rem ? "wide" : width >= HERO_MID_REM * rem ? "mid" : "narrow"
}

/**
 * Telefon düzeninde mi (doğru/yanlış) — Self Servis dışındaki sayfalar (Güvenlik, Takvim'in izin
 * tablosu, Yenilikler, katalog, tyroRM) bunu kullanır. Kartın kırılımı da gereken Self Servis
 * `usePageLayout`u kullanır.
 */
export function usePhoneLayout(ref) {
  return usePageLayout(ref).phone
}

/**
 * Sayfanın düzeni, kabın eninden. `phone` — telefon düzeni mi (kartta iki sütun bilgi ve kişi
 * şeridi, tek satır özet, yapışkan tam en sekmeler, filtre çekmecesi, sağ altta yüzen "Yeni"): kap
 * dar (< 40rem) ve ekran telefon (`useIsMobile`, < 768 px) ya da dokunmatik (tablet); ya da yatay
 * telefon. Fareli masaüstü dar kapta (kenar çubuğu, sohbet rıhtımı açık) bugünkü düzende kalır.
 *
 * `hero` — kartın düzeni (`SelfHero`; boyu To-Do'nun kartıyla aynı, `header/selfHero.css`):
 * `wide` tepsi yanda, kişi hapları; `mid` tepsi yanda, kişi şeridi; `narrow` kart yalnız kişi,
 * tepsi kartın altında (telefonda özet listenin üstünde); `short` kart tek sıra. Telefon düzeninde
 * kart hep `narrow` ya da `short`.
 *
 * Kap ölçümü boyamadan önce (layout effect): düzen bir kare bile yanlış çizilmez. Durum yalnız
 * kırılım değişince güncellenir (her pikselde çizim yok). Kabın genişliği bu karara bağlı değil
 * (yan boşluk yalnız görüntü alanına bağlı): salınım olmaz.
 */
export function usePageLayout(ref) {
  const mobile = useIsMobile()
  const coarse = useMediaQuery(COARSE)
  const shortTouch = useMediaQuery(SHORT_TOUCH)
  const short = useMediaQuery(SHORT)
  const [box, setBox] = useState(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 0
    return { narrow: width < PHONE_MAX, band: width ? bandOf(width) : "wide" }
  })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = () => {
      const width = el.getBoundingClientRect().width
      const next = { narrow: width < PHONE_MAX, band: bandOf(width) }
      setBox((prev) => (prev.narrow === next.narrow && prev.band === next.band ? prev : next))
    }
    read()
    // Kök yazı boyu pencerenin boyuyla değişir: kap eni aynı kalsa da rem eşiği kayar.
    window.addEventListener("resize", read)
    if (typeof ResizeObserver === "undefined")
      return () => window.removeEventListener("resize", read)
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", read)
    }
  }, [ref])
  const phone = shortTouch || ((mobile || coarse) && box.narrow)
  const hero = short ? "short" : phone ? "narrow" : box.band
  return { phone, hero }
}

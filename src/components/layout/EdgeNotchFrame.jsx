import { NOTCH_TOP } from "@/lib/edgeNotchGeometry"

/**
 * Sağ kenar çentiğinin sabit çerçevesi (`EdgeNotch` içinde göreli). Sağ kenarı `--notch-edge`:
 * panel açıkken ana sütunun kenarı, yoksa ekranın kenarı (`useNotchEdge`). Yalnız SAĞDAN kırpılır:
 * kapalı ray sağa kayıp gizleniyor — ekran kenarında kayan kısım zaten görünmüyordu, panelin
 * kenarında panelin üstüne binerdi. Tutamak, gölge ve paneller (portal) sola ve dikeyde taşabilir.
 * Çerçeve fareyi geçirir (yalnız ray alır): kapalı rayın boşalttığı yer sayfanın, tekerlek orada da
 * sayfayı kaydırmalı.
 *
 * ⚠️ `position: fixed`, `absolute` DEĞİL: çentik içerik kartının (`SidebarInset`, `md:m-2
 * rounded-xl overflow-hidden`) içinde mount oluyor ve kart görüntü alanından 8px içeride bitiyor;
 * `absolute right-0` "duvara akan" omzu kartın kenarına dayıyordu. Dikeyde header'ın altındaki
 * alanda ortalı: `top` alanın ortası, `translateY(-50%)` rayın boyunu düşer (`lib/edgeNotchGeometry.js`).
 * ⚠️ Genişlik LİTERAL: Tailwind kaynağı metin olarak tarar,
 * `NOTCH_RAIL_REM` ile aynı sayı olmak zorunda. Yalnız `lg`+.
 */
export function EdgeNotchFrame({ children }) {
  return (
    <div
      className="pointer-events-none fixed z-30 hidden w-[5.625rem] lg:block"
      style={{
        top: NOTCH_TOP,
        transform: "translateY(-50%)",
        right: "var(--notch-edge, 0px)",
        clipPath: "inset(-100vh 0 -100vh -100vw)",
      }}
    >
      {children}
    </div>
  )
}

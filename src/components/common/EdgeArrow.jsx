import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { cn } from "@/lib/utils"

/**
 * Kartın kenar oku (‹ ›) — yığın widget'ları (`widgets/StackNav`) ve sıradaki toplantı kartı
 * aynı dili konuşur. Ok kartın İÇİNDE, kenarda (~20 px'lik iç boşluğa sığan, görünmez ve ince
 * dikey bir basma alanı; dışarıda iken yan yana iki kartın okları üst üste biniyordu).
 *
 * Okun arkasında HİÇBİR hap ya da kutu yok (istek üzerine), yalnız ok: renkli kartta (yardım
 * küresi) zemini değiştirmez. Okun ÜSTÜNE gelince (ya da klavye odağında) ok büyür ve netleşir,
 * okun olduğu kenarın ARKASI yumuşakça bulanıklaşır: sağ okta sağ kenar, sol okta sol kenar.
 *
 * Bulanıklık TEK katman: kenarda tam, içeri doğru saydama silinir (maske) ve opaklıkla
 * belirir/kaybolur (300 ms) — bulanıklık değeri değil opaklık geçer, yani geçiş her tarayıcıda
 * akıcı. Basamaklı katmanlar (bir önceki sürüm) yazıyı ortasından kesik kesik bulanıklaştırıyordu.
 * Katman okun kardeşi (`peer`): durum oktan okunur, tıklama almaz; görünmezken `invisible`
 * (boşta çizim maliyeti yok).
 *
 * Görünürlük kartın grubuna bağlı (`group-hover/<ad>`), o yüzden çağıran `className` ile
 * verir. Gizliyken ok kenara doğru biraz kaymış durur. Dokunmatikte basılan alan görünmez
 * payla 44 px'e çıkar.
 */
const BUTTON =
  "absolute top-1/2 z-10 grid h-14 w-[1.125rem] -translate-y-1/2 place-items-center rounded-full text-foreground/80 outline-none transition-[opacity,translate,scale,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] after:absolute after:-inset-x-3 after:-inset-y-1 pointer-coarse:after:content-[''] hover:scale-125 hover:text-foreground focus-visible:scale-125 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:transition-none"

// Yön başına sabit sınıflar (Tailwind yalnız tam yazılmış sınıfı üretir).
const SIDE = {
  prev: { button: "peer/edge-prev left-[3px] -translate-x-1", icon: ArrowLeft01Icon },
  next: { button: "peer/edge-next right-[3px] translate-x-1", icon: ArrowRight01Icon },
}
const SCRIM =
  "pointer-events-none invisible absolute inset-y-0 z-[9] w-24 opacity-0 backdrop-blur-[6px] transition-[opacity,visibility] duration-300 ease-out motion-reduce:transition-none"
const SCRIM_SIDE = {
  prev: "left-0 rounded-l-[1.75rem] [mask-image:linear-gradient(to_right,#000_25%,transparent)] peer-hover/edge-prev:visible peer-hover/edge-prev:opacity-100 peer-focus-visible/edge-prev:visible peer-focus-visible/edge-prev:opacity-100",
  next: "right-0 rounded-r-[1.75rem] [mask-image:linear-gradient(to_left,#000_25%,transparent)] peer-hover/edge-next:visible peer-hover/edge-next:opacity-100 peer-focus-visible/edge-next:visible peer-focus-visible/edge-next:opacity-100",
}

/**
 * `dir` -1 sol, 1 sağ. Ok ve bulanıklık katmanı KARDEŞ çizilir (parça): çağıranın kabında
 * okun ardından gelmesi şart, `peer` yalnız sonraki kardeşi görür.
 */
export function EdgeArrow({ dir, label, title, onClick, buttonRef, className }) {
  const side = dir < 0 ? "prev" : "next"
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title={title}
        onClick={onClick}
        className={cn(BUTTON, SIDE[side].button, className)}
      >
        <HugeiconsIcon icon={SIDE[side].icon} className="size-4" strokeWidth={2.4} />
      </button>
      <span aria-hidden="true" className={cn(SCRIM, SCRIM_SIDE[side])} />
    </>
  )
}

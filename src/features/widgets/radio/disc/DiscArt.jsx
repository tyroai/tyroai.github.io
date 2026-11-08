import { useEffect, useRef } from "react"
import { animate, motion, useMotionValue } from "motion/react"
import { StationArt } from "../radioParts"
import { coverSide, discPose, uprightDelta } from "./discModel"

// Bir tur (CSS'teki `disc-turn` ile aynı): CD sakin döner, plak gibi hızlı değil.
const TURN_MS = 10_000
// Düzen değişince (kart boyu) disk uzun, sakin bir yayla yerine geçer.
const MOVE = { type: "spring", bounce: 0, duration: 1.4 }
const UPRIGHT = { type: "spring", bounce: 0, duration: 1.6 }

/**
 * Kartın kenarından taşan disk (tek kare öğe, yarısından azı görünür). Çalarken kanalın görseli
 * sürekli döner (ortasında şeffaf göbek, üstünde gökkuşağı yansıması). Çalmıyorken (`rest`)
 * kanal görseli yerine plak: oluklu yüz, ortada paletin degradesiyle etiket — kanal logoları çoğu
 * zaman düşük çözünürlüklü, kart ilk bakışta onlarla açılmasın. Kanalın görseli altta hazır
 * bekler (çalınca boşluk olmaz); duran disk en kısa yoldan dikleşir. Yer `motion` ile, dönüş
 * CSS'te (`disc.css` › `disc-turn`: bileştiricide döner, dinlenme kipinde durur).
 */
export function DiscArt({ station, box, rest, spinning }) {
  const side = coverSide(box.w, box.h)
  const pose = discPose(box.w, box.h, box.layout)
  const spin = useRef(null)
  const upright = useMotionValue(0)
  const was = useRef(spinning)
  // Dönüş durunca CSS animasyonu olduğu açıda bekler; üstteki katman farkı kapatır (dik görsel).
  // Yeniden çalınca CSS kaldığı yerden sürer: toplam açı sıfırdan başlar, sıçrama olmaz.
  useEffect(() => {
    const stopped = was.current && !spinning
    was.current = spinning
    if (!stopped) return undefined
    const anim = spin.current?.getAnimations?.()[0]
    const t = Number(anim?.currentTime) || 0
    const angle = ((t % TURN_MS) / TURN_MS) * 360 + upright.get()
    const controls = animate(upright, upright.get() + uprightDelta(angle), UPRIGHT)
    return () => controls.stop()
  }, [spinning, upright])

  return (
    <motion.div
      aria-hidden="true"
      className="disc-art"
      data-rest={rest || undefined}
      style={{
        width: side,
        height: side,
        marginLeft: -side / 2,
        marginTop: -side / 2,
        "--disc-side": `${side}px`,
      }}
      initial={false}
      animate={pose}
      transition={MOVE}
    >
      <motion.div className="disc-upright" style={{ rotate: upright }}>
        <div ref={spin} className="disc-spin">
          {station && <StationArt station={station} size="lg" className="size-full" />}
        </div>
      </motion.div>
      <span className="disc-sheen" />
      <span className="disc-hub" />
      <span className="disc-rest" />
    </motion.div>
  )
}

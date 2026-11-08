import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useAnimate } from "motion/react"
import { TyroScramble } from "../LoginScramble"
import { LoginMascot } from "./LoginMascot"
import { EASE, HANDOFF, INTRO } from "./loginMotion"

/** Açılışta maskotun büyüklüğü (Atlas'ta robot 1,75×; küre daha dolgun, biraz az). */
const BIG = { phone: 1.35, wide: 1.6 }

/** Yuvanın merkezinden ekranın merkezine dikey uzaklık (px). */
function toCenter(slot) {
  const r = slot.getBoundingClientRect()
  return Math.round(window.innerHeight / 2 - (r.top + r.height / 2))
}

/**
 * Maskotun sahnesi. AÇILIŞ: ekranın ortasında büyük ve bulanık belirir, netleşir, bekler, yerine
 * çekilir (Atlas'ın robotu gibi; yazılar o çekilirken akar). BAĞLAN: girişin geçişi — maskot
 * ekranın ortasına gelir, nefes alıp içine çöker, yerinde "CONNECTING TO TYRO" dizilir
 * (`LoginScramble`). Zemin hep beyaz: girişteki karartma ve renk halesi yok. Hareket `useAnimate`
 * ile, React durumu kare başına değişmez. Azaltılmış harekette açılış yok, geçiş anında.
 */
export function LoginStage({ size, mood, phone, reduce, leaving, intro = true }) {
  const slot = useRef(null)
  // Büyüklük ilk çizimdeki cihazdan: döndürünce açılış yeniden başlamasın.
  const big = useRef(phone ? BIG.phone : BIG.wide)
  const [scope, animate] = useAnimate()
  const [scramble, setScramble] = useState(false)

  // Boyamadan önce: yuvanın yeri ölçülür, maskot ortadan başlar. Bir "oynadı" bayrağı YOK:
  // `useAnimate` kaldırılınca animasyonlarını durdurur (geliştirmedeki çift bağlama da öyle) ve
  // bayrak ikinci bağlanışta yeniden başlatmayı engelleyip maskotu ilk karede donduruyordu.
  useLayoutEffect(() => {
    if (reduce || !intro || !slot.current) return
    const dy = toCenter(slot.current)
    const scale = big.current
    animate(
      scope.current,
      {
        opacity: [0, 1, 1, 1],
        scale: [scale * 0.9, scale, scale, 1],
        y: [dy, dy, dy, 0],
        filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(0px)"],
      },
      {
        duration: INTRO.duration,
        times: INTRO.times,
        ease: ["easeOut", "linear", [0.65, 0, 0.35, 1]],
      },
    )
  }, [animate, scope, reduce, intro])

  useEffect(() => {
    if (!leaving || !slot.current) return undefined
    let alive = true
    animate(
      scope.current,
      { y: toCenter(slot.current), scale: 1, opacity: 1, filter: "blur(0px)" },
      { duration: reduce ? 0 : HANDOFF.center, ease: EASE },
    ).then(() => {
      if (!alive) return
      setScramble(true)
      // Girişin iki vuruşu: nefes (0–260 ms, büyür ve parlar), çöküş (260–620 ms, küçülür ve söner).
      animate(
        ".login-orb",
        {
          scale: [1, 1.1, 0.72],
          opacity: [1, 1, 0],
          filter: [
            "brightness(1) blur(0px)",
            "brightness(1.18) blur(0px)",
            "brightness(1.18) blur(16px)",
          ],
        },
        { duration: 0.62, times: [0, 260 / 620, 1], ease: [0.32, 0, 0.67, 0] },
      )
    })
    return () => {
      alive = false
    }
  }, [leaving, animate, scope, reduce])

  return (
    <div ref={slot} className="login-stage">
      <div ref={scope} className="login-move" style={reduce || !intro ? undefined : { opacity: 0 }}>
        <div className="login-orb">
          <LoginMascot state={mood} size={size} />
        </div>
        <div className="login-scramble">
          <TyroScramble active={scramble} isDark={false} />
        </div>
      </div>
    </div>
  )
}

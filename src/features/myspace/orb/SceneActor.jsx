import { motion } from "motion/react"
import { BrandOrb } from "@/components/brand/BrandOrb"

const EASE = [0.2, 0.9, 0.25, 1]
const spring = (duration, bounce, delay = 0) => ({ type: "spring", duration, bounce, delay })

/** Sahnenin tek seferlik girişi: köşeden fırlar, kenardan kayar, alttan yükselir, havada oturur. */
function entrance(preset, kind, rtl) {
  const sx = (v) => (rtl ? `${-v}%` : `${v}%`)
  switch (preset) {
    case "hand":
      return { initial: { opacity: 0, x: sx(18), y: "24%" }, transition: spring(0.42, 0.22) }
    case "mirror":
      return { initial: { opacity: 0, x: sx(-18), y: "24%" }, transition: spring(0.42, 0.22) }
    case "mirrorUp":
      return { initial: { opacity: 0, x: sx(-18), y: "30%" }, transition: spring(0.45, 0.3) }
    case "side":
      return { initial: { opacity: 0, x: sx(22) }, transition: { duration: 0.36, ease: EASE } }
    case "float":
      // Kart önce gelir, küre arkasından başını uzatır.
      return { initial: { opacity: 0, y: "22%" }, transition: spring(0.5, 0.2, 0.12) }
    case "carry":
      return { initial: { opacity: 0, y: "30%" }, transition: { duration: 0.5, ease: EASE } }
    case "stack":
      return { initial: { opacity: 0, y: "20%" }, transition: { duration: 0.36, ease: "easeOut" } }
    default:
      if (kind === "tomorrow")
        return { initial: { opacity: 0, y: "30%" }, transition: { duration: 0.6, ease: "easeOut" } }
      return {
        initial: { opacity: 0, y: preset === "tuck" ? "38%" : "30%" },
        transition: spring(0.48, 0.18),
      }
  }
}

/**
 * Sahnenin oyuncusu — GERÇEK küre (`BrandOrb`), üç katman: yer (CSS geçişiyle kayar; aynı aile
 * ve boyda küre yeni yerine yürür, yeniden kurulmaz), tek seferlik giriş ve üstüne gelince hafif
 * kalkış. Hâl slayt başına bir kez değişir (maskot SVG'si her hâlde yeniden kurulur); dinlenme
 * kipinde uygulamanın uykusu kazanır. Tıklanmaz, ekran okuyucuya görünmez.
 */
export function SceneActor({ layout, scene, kind, live, resting, rtl, reduce, jump }) {
  const { actor, d, look } = layout
  const e = entrance(layout.preset, kind, rtl)
  const pose = resting ? undefined : live && scene.wakeOnLive ? "listening" : scene.pose
  return (
    <div
      className={look ? "orb-scene-pos orb-scene-look" : "orb-scene-pos"}
      style={{
        transform: `translate3d(${actor.x}px, ${actor.y}px, 0)`,
        ...(look ? { "--look-x": `${look.x}px`, "--look-y": `${look.y}px` } : null),
      }}
    >
      <motion.div
        className={jump ? "ms-orb-enter" : undefined}
        initial={reduce || jump ? false : e.initial}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={e.transition}
      >
        <span
          className="orb-scene-lift"
          style={rtl && scene.mirrorRtl ? { scale: "-1 1" } : undefined}
        >
          <BrandOrb
            surface="dashboard"
            trackPage={!look}
            size={d}
            expressive
            mascotState={pose}
            glasses={Boolean(scene.glasses)}
            reading={Boolean(scene.reading)}
            restState="idle"
            state={live ? "listening" : "idle"}
          />
        </span>
      </motion.div>
    </div>
  )
}

/**
 * "TYRO ile tanış"ın zaman çizelgesi — açılış Atlas'tan ölçüldü (`workos.com/atlas`, 1440 px):
 * robot bulanıktan netleşerek büyür (0,3–1,5 sn), büyük bekler, yerine çekilirken yazılar 10 px
 * aşağıdan, 4 px bulanıktan süzülür (2,2–3,4 sn), düğmeler en son. Bağlan sonrası girişin geçişi
 * (`LoginScramble` zaman çizelgesi): çerçeve söner, maskot ortaya gelir, nefes alıp içine çöker,
 * yerinde "CONNECTING TO TYRO" dizilir; zemin hep beyaz.
 */

export const EASE = [0.22, 1, 0.36, 1]

/** Açılış: maskotun büyükken boyu, toplam süre ve dilimleri (belir · bekle · yerine çekil). */
export const INTRO = {
  duration: 2.9,
  times: [0, 0.36, 0.58, 1],
  /** Yazıların akmaya başladığı an (sn) — maskot yerine çekilirken. */
  textAt: 1.75,
}

/** Bağlan sonrası: çerçevenin sönmesi, maskotun ortaya gelişi (sn), girişin geçişi (ms). */
export const HANDOFF = {
  chrome: 0.22,
  center: 0.45,
  scrambleMs: 2380,
}
export const HANDOFF_MS = Math.round(HANDOFF.center * 1000) + HANDOFF.scrambleMs

const HIDDEN = { opacity: 0, y: 10, filter: "blur(4px)" }
const SHOWN = { opacity: 1, y: 0, filter: "blur(0px)" }
const GONE = { opacity: 0, y: -8, filter: "blur(6px)" }

/**
 * Çerçeve öğesinin (başlık şeridi, alt yazı, Bağlan, telif) hareketi: açılışta `at` saniyede
 * süzülerek gelir, Bağlan'da söner. Azaltılmış harekette yerinde başlar, yalnız saydamlıkla söner.
 */
export function reveal(reduce, at, leaving) {
  if (leaving)
    return {
      animate: reduce ? { opacity: 0 } : GONE,
      transition: { duration: HANDOFF.chrome, ease: EASE },
    }
  if (reduce) return { initial: false, animate: SHOWN }
  return {
    initial: HIDDEN,
    animate: SHOWN,
    transition: { duration: 1, delay: at, ease: EASE },
  }
}

/** Başlığın kelimeleri: aynı süzülme, kelime kelime 50 ms arayla — yazı "akar". */
export function wordReveal(reduce, at, index) {
  if (reduce) return { initial: false, animate: SHOWN }
  return {
    initial: { opacity: 0, y: "0.3em", filter: "blur(6px)" },
    animate: SHOWN,
    transition: { duration: 0.9, delay: at + 0.05 * index, ease: EASE },
  }
}

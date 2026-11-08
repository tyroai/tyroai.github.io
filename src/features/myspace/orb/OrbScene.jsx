import { useMemo } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { useRest } from "@/lib/restMode"
import "@/lib/i18n/orb"
import { OrbNext } from "../OrbNext"
import { SCENES, sceneLayout } from "./lib/sceneGeometry"
import { sceneFacts } from "./lib/sceneFacts"
import { mainText, sceneCopy } from "./sceneCopy"
import { SceneActor } from "./SceneActor"
import { SceneCard } from "./SceneCard"
import "./orbScene.css"

const ORB_FADE = { duration: 0.15 }
/** İlk açılışın zıplaması (`ms-orb-enter`: 0,35 sn bekleme + 1,15 sn) bitince kart uzatılır. */
const JUMP_LANDS = 1.5
/** Başlığın tek satırda kalıp kalmadığının kaba tahmini (yazının ortalama harf eni, em). */
const GLYPH_EM = 0.56

/**
 * Küre kartının SAHNESİ: her öneri sınıfı maskotun uzattığı aynı beyaz kartta, kürenin yeri,
 * boyu, hâli ve kartla katmanı sınıfa göre (`sceneGeometry`). Kart ve küre ayrı ayrı değişir:
 * kart türe göre, küre aileye ve boya göre — aynı köşedeki iki öneri arasında küre yeniden
 * kurulmaz, yeni yerine kayar. Katman tıklamayı alttaki büyük düğmeye bırakır; yalnız kartın
 * düğmesi ve ok tıklanır. Yeni slayt yalnız elle gezilirken duyurulur.
 */
export default function OrbScene({ deck, slide, act, ctx, box, coarse, live, view, intro }) {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const resting = useRest()
  // Uygulama Arapçada da soldan sağa (LocaleProvider); sahne belgenin yönünü izler.
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl"
  const kind = slide.kind
  const now = ctx?.now ?? 0
  const events = ctx?.events ?? null
  const tasks = ctx?.tasks ?? null
  const items = slide.items

  const facts = useMemo(
    () => sceneFacts(slide, { now, events, tasks }),
    // Slayt nesnesi her çizimde yeniden kuruluyor: türe ve veriye bağlanır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, now, events, tasks, items],
  )
  if (!facts || !SCENES[kind]) return null

  const copy = sceneCopy(facts, slide, t, locale)
  const base = {
    w: box.w,
    h: box.h,
    rem: box.rem,
    coarse,
    rtl,
    view,
    avail: {
      sup: Boolean(facts.support),
      vis: Boolean(facts.visual),
      leadLines: facts.leadLines,
    },
  }
  let layout = sceneLayout(kind, base)
  // Sayı + birim ya da tek satırlık cümle sığmıyorsa başlık iki satıra bütçelenir.
  if (!facts.nowrap && layout.card.leadLines === 1) {
    const inner = layout.card.width - 1.75 * box.rem
    const est = mainText(copy.main).length * GLYPH_EM * 0.9375 * box.rem
    if (est > inner) layout = sceneLayout(kind, { ...base, avail: { ...base.avail, leadLines: 2 } })
  }
  const jump = intro && !deck.moved
  const actorKey = `${layout.family}:${layout.d}`

  return (
    <div className="pointer-events-none absolute inset-0">
      <span className="sr-only" aria-live={deck.manual ? "polite" : "off"}>
        {slide.text}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={actorKey}
          aria-hidden="true"
          inert
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0 } : ORB_FADE}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: layout.z }}
        >
          <SceneActor
            layout={layout}
            scene={SCENES[kind]}
            kind={kind}
            live={live}
            resting={resting}
            rtl={rtl}
            reduce={reduce}
            jump={jump}
          />
        </motion.div>
      </AnimatePresence>
      {/* İlk çizimde kart yerinde durur (açılışın sakinliği hareketi bekletiyor); yalnız ilk
          açılışın zıplamasında küre inince uzatılır. */}
      <AnimatePresence mode="wait" initial={jump || deck.moved}>
        <SceneCard
          key={kind}
          kind={kind}
          layout={layout}
          copy={copy}
          visual={facts.visual}
          nowrap={facts.nowrap}
          locale={locale}
          describe={slide.text}
          tip={t(`orb.tip.${kind}`)}
          onAct={() => act(slide)}
          rtl={rtl}
          reduce={reduce}
          delay={jump ? JUMP_LANDS : undefined}
          next={<OrbNext deck={deck} onCard slop />}
        />
      </AnimatePresence>
    </div>
  )
}

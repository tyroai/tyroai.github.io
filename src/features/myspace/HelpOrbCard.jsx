import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { useLocale } from "@/hooks/useLocale"
import { useCircleCelebrations } from "@/features/myspace/hooks/useCircleCelebrations"
import { useIntroOnce } from "@/features/myspace/hooks/useIntroOnce"
import { TypewriterText } from "./TypewriterText"
import { useOrbStyle } from "@/hooks/useOrbStyle"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { orbSizeFor, useOrbBox } from "@/features/myspace/hooks/useOrbBox"
import { HelpCardColleagues } from "./HelpCardColleagues"
import { HelpCardInstall } from "./HelpCardInstall"
import { OrbNext } from "./OrbNext"
import { useOrbDeck } from "./useOrbDeck"
import { useOrbSuggestions } from "./useOrbSuggestions"
import { requestOpenChat } from "@/lib/chatBus"
import { cn } from "@/lib/utils"
import "./intro.css"

/* ─── Sana nasıl yardımcı olabilirim? ───────────────────────────────── */

/** Açılışta TEK sevinç zıplaması (maskotun `success`i ~1,3 sn), sonra her zamanki hâl. */
const CHEER_MS = 1700
/** Küre köşeyle orta arasında yer değiştirirken önce söner, yeni yerinde belirir (sıçramasın). */
const ORB_FADE = { duration: 0.15 }
const NO_SLIDES = []
const loadScene = () => import("./orb/OrbScene")
const OrbScene = lazy(loadScene)
const CelebrationOrb = lazy(() => import("./CelebrationOrb"))
const CelebrationDecor = lazy(() =>
  import("./CelebrationOrb").then((m) => ({ default: m.CelebrationDecor })),
)

/**
 * Anasayfa'nın yardım kartı ("Sana nasıl yardımcı olabilirim?") — paletin gradyanı ve GERÇEK
 * küre (`BrandOrb`). Kartın kendisine basmak her hâlde sohbeti açar (kartı kaplayan ayrı düğme;
 * küre `inert` + `aria-hidden` bir katmanda, iç içe düğme yok).
 *
 * Kipler (`useOrbDeck`): slayt yoksa başlık ve alttan yükselen büyük küre; çevrede kutlama varsa
 * maskot tebrik kartını uzatır; anın önerileri SAHNE olarak gelir (`orb/OrbScene`: her sınıf aynı
 * beyaz kartta, kürenin yeri, boyu ve hâli sınıfa göre); kurulum önerisi bugünkü zengin kartıyla.
 * Kişinin kendi günü (sahne) slayt değil, kartın tamamı. Ayrıntı:
 * docs/features/anasayfa-kutlamalar.md › Yardım kartı.
 *
 * `anchorRef`: Anasayfa sağ kenar çentiğini bu karta hizalıyor. `ctx`: panonun verisi.
 */
export function HelpOrbCard({ className, anchorRef, scene = null, ctx = null }) {
  const { t } = useLocale()
  const [live, setLive] = useState(false)
  const hostRef = useRef(null)
  const titleRef = useRef(null)
  const label = t("myspace.help.title")
  // İlk açılışta küre dışarıdan zıplar (1,5 sn), ardından başlık harf harf yazılır.
  const intro = useIntroOnce("help-orb")
  const colleagues = useCircleCelebrations()
  const orb = useOrbSuggestions(ctx)
  const coarse = useMediaQuery("(pointer: coarse)")
  // Kart üstündeyken ya da içinde odak varken dönüş durur (`useOrbDeck`).
  const [focused, setFocused] = useState(false)
  const deck = useOrbDeck(
    scene ? NO_SLIDES : orb.list,
    !scene && colleagues.length > 0,
    live || focused,
    hostRef,
  )
  const slide = deck.slide
  const mode = !slide
    ? "title"
    : slide.kind === "colleagues"
      ? "colleagues"
      : slide.kind === "install"
        ? "install"
        : "suggestion"
  const takeover = mode === "colleagues" || mode === "install"
  const box = useOrbBox(hostRef, titleRef, mode)
  const chosen = useOrbStyle() === "mascot" ? "mascot" : "sphere"
  // Kendi gününde küre seçen kişide de maskot: pastayı tutacak eller yalnız maskotta (o gün).
  const view = scene ? "mascot" : chosen
  const orbSize = orbSizeFor(box, {
    view,
    scene: scene?.scene ?? null,
    takeover: takeover ? mode : null,
  })

  // Sahne parçası tembel ama kart takılınca iner: öneriler takvimden sonra gelir, ilk sahne
  // parça inmeden çizilirse kart bir an boş kalırdı.
  useEffect(() => {
    loadScene()
  }, [])

  const setHost = useCallback(
    (node) => {
      hostRef.current = node
      if (anchorRef) anchorRef.current = node
    },
    [anchorRef],
  )

  // Sevinç bir kez, ve kıyafet değişirse (önizlemede) yeniden; zamanlayıcı efektin içinde.
  const cheerKey = scene ? scene.scene : null
  const [cheered, setCheered] = useState(null)
  const cheering = !!cheerKey && cheered !== cheerKey && orbSize > 0
  useEffect(() => {
    if (!cheering) return undefined
    const id = setTimeout(() => setCheered(cheerKey), CHEER_MS)
    return () => clearTimeout(id)
  }, [cheering, cheerKey])

  return (
    <div
      ref={setHost}
      data-tour="helporb"
      onPointerEnter={() => setLive(true)}
      onPointerLeave={() => setLive(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      onPointerDown={deck.stop}
      onKeyDown={deck.stop}
      className={cn(
        "group relative isolate flex min-h-[15rem] min-w-0 flex-col overflow-hidden rounded-[1.75rem]",
        takeover ? "p-3" : "p-5",
        "shadow-[0_18px_40px_-24px_var(--brand-via)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-from via-brand-via to-brand-to"
      />
      {/* Kürenin arkasındaki ışık alt kenara oturmuş: küre paletin renklerinden, zemin de. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-[radial-gradient(60%_55%_at_50%_100%,rgb(255_255_255/0.5),transparent_75%)]"
      />
      {scene && (
        <Suspense fallback={null}>
          <CelebrationDecor scene={scene.scene} years={scene.years} />
        </Suspense>
      )}
      {/* Başlık ya da kutlama bloğu ölçülür: küre altına sığar. Kap tıklamayı alttaki düğmeye bırakır. */}
      <div ref={titleRef} className="pointer-events-none relative z-20 min-w-0">
        {mode === "colleagues" ? (
          <HelpCardColleagues people={colleagues} />
        ) : mode === "install" ? (
          <HelpCardInstall
            ios={orb.promo.ios}
            onDismiss={orb.promo.dismiss}
            next={deck.slides.length > 1 ? <OrbNext deck={deck} onCard slop /> : null}
          />
        ) : mode === "title" ? (
          <p
            aria-hidden="true"
            className="max-w-[11rem] text-[1.3125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-brand-on-ramp [text-shadow:0_1px_2px_rgb(0_0_0/0.18)]"
          >
            {/* Tam metin yer tutar (küre başlığın boyuna göre ölçülür), yazılan üstünde. */}
            <span className="relative block">
              <span className={intro ? "invisible" : undefined}>{label}</span>
              {intro && (
                <span className="absolute inset-0">
                  <TypewriterText text={label} delay={1450} />
                </span>
              )}
            </span>
          </p>
        ) : null}
      </div>
      {mode === "suggestion" && box && (
        <Suspense fallback={null}>
          <OrbScene
            deck={deck}
            slide={slide}
            act={orb.act}
            ctx={orb.scene}
            box={box}
            coarse={coarse}
            live={live}
            view={view}
            intro={intro}
          />
        </Suspense>
      )}
      {/* Köşe (kutlama, kurulum) ile orta arasında küre yeniden kurulur: eskisi söner, yenisi
          yerinde belirir. Öneri sahnesinde küre sahnenin kendi oyuncusu. */}
      <AnimatePresence mode="wait" initial={false}>
        {mode !== "suggestion" && (
          <motion.div
            key={takeover ? "side" : "center"}
            aria-hidden="true"
            inert={true}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={ORB_FADE}
            className={cn(
              "pointer-events-none absolute bottom-0 transition-transform duration-200 ease-out",
              takeover
                ? "end-0 z-30 translate-x-[26%] translate-y-[40%] group-hover:translate-y-[34%] rtl:-translate-x-[26%]"
                : "left-1/2 -translate-x-1/2",
              takeover
                ? null
                : !scene
                  ? "translate-y-[40%] group-hover:translate-y-[35%]"
                  : scene.scene === "anniversary"
                    ? "translate-y-[21%] group-hover:translate-y-[17%]"
                    : "translate-y-[20%] group-hover:translate-y-[16%]",
            )}
          >
            <div className={intro && !deck.moved ? "ms-orb-enter" : undefined}>
              {orbSize > 0 && scene && (
                // Kutlama günü: o günün sahnesi (tembel). Gözler sevinçten kısık, üstüne gelince dinler.
                <Suspense fallback={null}>
                  <CelebrationOrb
                    size={orbSize}
                    scene={scene.scene}
                    years={scene.years}
                    state={live ? "listening" : cheering ? "success" : "idle"}
                    expression={live ? undefined : "happy"}
                  />
                </Suspense>
              )}
              {orbSize > 0 && !scene && (
                <BrandOrb
                  surface="dashboard"
                  state={live ? "listening" : "idle"}
                  mascotState={live ? "listening" : undefined}
                  restState="idle"
                  trackPage
                  size={orbSize}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {mode === "colleagues" && <OrbNext deck={deck} corner />}
      <button
        type="button"
        aria-label={label}
        onClick={() => requestOpenChat({ focusComposer: true })}
        onFocus={() => setLive(true)}
        onBlur={() => setLive(false)}
        className="absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-brand-on-brand/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
    </div>
  )
}

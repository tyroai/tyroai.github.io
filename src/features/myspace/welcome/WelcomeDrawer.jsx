import "@/lib/i18n/insight"
import { useId, useLayoutEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { motion, useTransform } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useBrief } from "@/hooks/useBrief"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { setWelcomeOpen } from "@/lib/welcomeGate"
import { useHelloChat } from "../hello/useHelloChat"
import { useHelloStory } from "../hello/useHelloStory"
import { useWelcomeOffer } from "../hello/useWelcomeOffer"
import { markOfferDone } from "../hello/offerDone"
import { useFitText } from "./useFitText"
import { useWelcomeDrag, QUICK } from "./useWelcomeDrag"
import { useWelcomeInk } from "./useWelcomeInk"
import { WelcomeActions } from "./WelcomeActions"
import { WelcomeBackdrop } from "./WelcomeBackdrop"
import { WelcomeCardLines } from "./WelcomeCardLines"
import { WeatherPearl } from "./WelcomeTokens"
import { skyOf, initialsOf } from "./welcomeText"
import "./welcome.css"

// Header'daki çanı açar (çekmece kapandıktan sonra): Radix tetiği tıklamayla açılır.
const openBell = () => document.querySelector("[data-bell-trigger]")?.click()

/**
 * TELEFONDA KARŞILAMA ÇEKMECESİ — Anasayfa oturumun ilk açılışında yukarıdan iner (ekranın ~%58'i):
 * paletin rampasından yukarıdan aşağı inen gradyan, gren ve süzülen ışık (`WelcomeBackdrop`; duraklar
 * ve yazının iki tonu `useWelcomeInk`), solda cam avatar (Profilim), sağda cam çan, orta-üstte
 * iki tonlu cümleler (`WelcomeLines`), alt kenarda koyu cam kapsül (`WelcomeActions`: Yeni · TYRO). Yukarı sürükleyince parmağı izler; satırlar üstten alta sırayla bulanıklaşıp dağılır,
 * karartı aynı oranda açılır ve uygulama yerinde belirir.
 * Karartı, tutamak, Esc ve Geri de kapatır; düğmeler çekmeceyi kapatıp kendi işini yapar.
 * Kurallar: `docs/features/anasayfa-karsilama.md`.
 */
/**
 * Öneriye dokununca (çekmece kapandıktan sonra): Anasayfa'daki Karşılama kartının aynı önerisi
 * açılır (günün okumasının cam ipucu — odak bloğu ekle, mola …); kart panoda yoksa sayfa başındaki
 * selamlamanın öneri düğmesi. Görünmeyen öğe açılmaz.
 */
function openBoardOffer() {
  const target = [
    document.querySelector('[data-widget="tyro-welcome"] .welcome-offer'),
    document.querySelector(".home-greeting__cue"),
  ].find((el) => el && el.offsetParent)
  if (!target) return
  target.scrollIntoView({ block: "center", behavior: "smooth" })
  target.click()
}

export default function WelcomeDrawer({ onClose, onNewChat, briefCtx, ...data }) {
  const { t, locale } = useLocale()
  const titleId = useId()
  const sheetRef = useRef(null)
  const bodyRef = useRef(null)
  const textRef = useRef(null)
  const after = useRef(null)
  const ink = useWelcomeInk()
  const me = useMe()
  const navigate = useNavigate()
  const access = usePageAccess()
  // Yazının iki tonu ve zeminin durakları çekmeceye değişken olarak iner (palet değişince yenilenir).
  const tone = useMemo(
    () => ({
      "--welcome-base": ink.base,
      "--welcome-mark": ink.mark,
      ...Object.fromEntries((ink.stops ?? []).map((c, i) => [`--welcome-g${i}`, c])),
    }),
    [ink],
  )
  // Karşılama kartıyla aynı akıl: hikâye, durum seçici ve brifingden öneri.
  const story = useHelloStory({
    weather: data.weather,
    cal: data.cal,
    focus: data.focus,
    now: +data.now,
    rangeStart: data.rangeStart,
    rangeEnd: data.rangeEnd,
    celebration: data.celebration,
  })
  const brief = useBrief(briefCtx)
  const offer = useWelcomeOffer(story, brief)
  const chat = useHelloChat(story, brief, offer)
  // Çekmecede havayı gösteren başka yer yok: gerçek bir öneri yoksa havanın sakin cümlesi
  // ("Dışarısı 13°, güzel bir gün.") ilk satır.
  const rows = useMemo(() => {
    const sky = story.sky
    if (!sky || chat.some((r) => r.id === "weather")) return chat
    const [a, b = ""] = t("insight.welcome.weather", { temp: "\u0000", rest: sky.tip }).split(
      "\u0000",
    )
    const parts = [{ text: a }, { text: sky.temp, mark: true }, { text: b }]
    const pearl = <WeatherPearl kind={sky.kind} night={sky.night} />
    return [{ id: "weather", pearl, parts }, ...chat]
  }, [chat, story.sky, t])

  const { y, fade, progress, bind, open, close } = useWelcomeDrag(sheetRef, () => {
    onClose()
    const next = after.current
    after.current = null
    next?.()
  })

  useLayoutEffect(() => {
    open()
    sheetRef.current?.focus({ preventScroll: true })
  }, [open])
  // Çekmece açıkken kendiliğinden gelen pencereler (toplantı geri sayımı) bekler (`lib/welcomeGate`).
  useLayoutEffect(() => {
    setWelcomeOpen(true)
    return () => setWelcomeOpen(false)
  }, [])
  useBackToClose(true, () => {
    close()
    return true
  })
  useFitText(bodyRef, textRef)

  // Tek kaynak: hepsi açıklıktan türer. Satırlar kendi pencerelerinde dağılır (`WelcomeLines`);
  // üst düğmeler ve kapsül erken solar.
  const chromeOpacity = useTransform(progress, [0.55, 1], [0, 1])
  const then = (fn) => {
    after.current = fn
    close(0, QUICK)
  }

  return createPortal(
    <motion.div
      className="welcome-root"
      style={{ ...bind.style, opacity: fade }}
      onPointerDown={bind.onPointerDown}
      onPointerMove={bind.onPointerMove}
      onPointerUp={bind.onPointerUp}
      onPointerCancel={bind.onPointerCancel}
      onClickCapture={bind.onClickCapture}
      onKeyDown={(e) => e.key === "Escape" && close()}
    >
      <motion.div
        aria-hidden="true"
        className="welcome-scrim"
        style={{ opacity: progress }}
        onClick={() => close()}
      />
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-scheme={ink.scheme}
        style={{ y, ...tone }}
        className="welcome-sheet"
      >
        <div className="welcome-panel">
          <WelcomeBackdrop sky={skyOf(data.weather?.forecast?.current)} />
          <motion.div className="welcome-top" style={{ opacity: chromeOpacity }}>
            {/* Kişinin avatarı (kullanıcı menüsündeki fotoğraf ya da baş harfler), camın kendisi: fotoğraf
                tam boy, üstünde camın ışığı; fotoğraf yoksa baş harfler cam diskte (çanla aynı malzeme).
                Dokununca çekmece kapanır, Profilim açılır. TYRO'nun küresi öneri satırında. */}
            <button
              type="button"
              className="welcome-avatar"
              aria-label={t("nav.profile")}
              onClick={() => then(() => navigate("/profile"))}
            >
              {me.photoUrl ? (
                <img src={me.photoUrl} alt="" className="welcome-avatar-face" />
              ) : (
                // Baş harfler CSS'ten (`data-initials`): görünen yazı düğmenin adıyla ("Profilim")
                // çelişmesin (axe: label-content-name-mismatch).
                <span
                  aria-hidden="true"
                  className="welcome-glass welcome-avatar-face"
                  data-initials={initialsOf(me.fullName, locale)}
                />
              )}
              {me.photoUrl && <span aria-hidden="true" className="welcome-glass" data-over="" />}
            </button>
            <button
              type="button"
              className="welcome-btn"
              aria-label={t("bell.title")}
              onClick={() => then(openBell)}
            >
              <span aria-hidden="true" className="welcome-glass" />
              <HugeiconsIcon icon={Notification01Icon} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </motion.div>
          <div ref={bodyRef} className="welcome-body">
            <WelcomeCardLines
              ref={textRef}
              titleId={titleId}
              progress={progress}
              maxRows={2}
              story={story}
              rows={rows}
              offer={offer}
              firstName={data.firstName}
              onOffer={(o) =>
                then(() => {
                  if (!o.prompt) return openBoardOffer()
                  markOfferDone(o.doneKey)
                  setPendingAsk({ question: o.prompt, agent: "tyroOffice" })
                  requestOpenChat({ focusComposer: true })
                })
              }
            />
          </div>
          <button
            type="button"
            className="welcome-grip"
            aria-label={t("insight.welcome.close")}
            onClick={() => close()}
          >
            <span aria-hidden="true" />
          </button>
        </div>
        <WelcomeActions
          opacity={chromeOpacity}
          access={access}
          onNew={(kind) =>
            then(() =>
              navigate(
                kind === "task" || kind === "meeting"
                  ? `/calendar?new=${kind}`
                  : `/self-service?new=${kind}`,
              ),
            )
          }
          onAsk={() => then(() => onNewChat?.())}
        />
      </motion.div>
    </motion.div>,
    document.body,
  )
}

import "@/lib/i18n/insight"
import { useId, useLayoutEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { motion, useTransform } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon"
import { joinableMeeting } from "@/components/layout/control/joinModel"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useJoinUrl } from "@/hooks/useJoinUrl"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { usePageAccess } from "@/hooks/usePageAccess"
import { joinInTeams } from "@/lib/teamsJoin"
import { useFitText } from "./useFitText"
import { useWelcomeDrag, QUICK } from "./useWelcomeDrag"
import { useWelcomeInk } from "./useWelcomeInk"
import { WelcomeActions } from "./WelcomeActions"
import { WelcomeBackdrop } from "./WelcomeBackdrop"
import { WelcomeLines } from "./WelcomeLines"
import { skyOf, initialsOf } from "./welcomeText"
import "./welcome.css"

// Header'daki çanı açar (çekmece kapandıktan sonra): Radix tetiği tıklamayla açılır.
const openBell = () => document.querySelector("[data-bell-trigger]")?.click()

/**
 * TELEFONDA KARŞILAMA ÇEKMECESİ — Anasayfa oturumun ilk açılışında yukarıdan iner (ekranın ~%58'i):
 * paletin rampasından yukarıdan aşağı inen gradyan, gren ve süzülen ışık (`WelcomeBackdrop`; duraklar
 * ve yazının iki tonu `useWelcomeInk`), solda yuvasız TYRO küresi (sohbet), sağda cam çan, orta-üstte
 * üç büyük iki tonlu cümle (`WelcomeLines`), alt kenarda koyu cam kapsül (`WelcomeActions`: Yeni talep ·
 * Toplantı/Katıl). Yukarı sürükleyince parmağı izler; satırlar üstten alta sırayla bulanıklaşıp dağılır,
 * karartı aynı oranda açılır ve uygulama yerinde belirir.
 * Karartı, tutamak, Esc ve Geri de kapatır; düğmeler çekmeceyi kapatıp kendi işini yapar.
 * Kurallar: `docs/features/anasayfa-karsilama.md`.
 */
/**
 * Öneriye dokununca: çekmece kapandıktan sonra Anasayfa'daki selamlamanın öneri düğmesi (kartı ve
 * eylemi orada — odak bloğu ekle, mola …) görünür yapılıp açılır.
 */
function openHomeCue() {
  const cue = document.querySelector(".home-greeting__cue")
  if (!cue) return
  cue.scrollIntoView({ block: "center", behavior: "smooth" })
  cue.click()
}

export default function WelcomeDrawer({ onClose, ...data }) {
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
  // Toplantı 15 dakika içinde başlıyor ya da sürüyorsa kapsülün birincili "Katıl" (Denetim
  // Merkezi'nin kuralı); bağlantı listede yoksa davetten okunur.
  const meeting = useMemo(
    () => joinableMeeting(data.cal?.events, data.now),
    [data.cal?.events, data.now],
  )
  const { url: joinUrl } = useJoinUrl(meeting, Boolean(meeting))
  // Yazının iki tonu ve zeminin durakları çekmeceye değişken olarak iner (palet değişince yenilenir).
  const tone = useMemo(
    () => ({
      "--welcome-base": ink.base,
      "--welcome-mark": ink.mark,
      ...Object.fromEntries((ink.stops ?? []).map((c, i) => [`--welcome-g${i}`, c])),
    }),
    [ink],
  )
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
                <span aria-hidden="true" className="welcome-glass welcome-avatar-face">
                  {initialsOf(me.fullName, locale)}
                </span>
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
            <WelcomeLines
              ref={textRef}
              progress={progress}
              titleId={titleId}
              onSuggest={() => then(openHomeCue)}
              {...data}
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
          onRequest={
            access.selfService ? (kind) => then(() => navigate(`/self-service?new=${kind}`)) : null
          }
          joinUrl={meeting ? joinUrl : null}
          onJoin={(e) => {
            // Önce Teams uygulaması (`joinInTeams` varsayılanı durdurur); olmazsa bağlantının kendisi
            // tarayıcıda yeni sekmede açılır.
            joinInTeams(e, joinUrl, t)
            close(0, QUICK)
          }}
          onMeeting={access.calendar ? () => then(() => navigate("/calendar?new=meeting")) : null}
        />
      </motion.div>
    </motion.div>,
    document.body,
  )
}

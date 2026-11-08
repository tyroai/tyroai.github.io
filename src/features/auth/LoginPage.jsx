import "@/lib/i18n/meet"
import { useEffect } from "react"
import { motion, useReducedMotion } from "motion/react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { LoginConnect } from "./login/LoginConnect"
import { LoginHeader } from "./login/LoginHeader"
import { LoginStage } from "./login/LoginStage"
import { LoginTitle } from "./login/LoginTitle"
import { INTRO, reveal } from "./login/loginMotion"
import { useLoginConnect } from "./login/useLoginConnect"
import { useLoginMood } from "./login/useLoginMood"
import "./login/login.css"

const HINT_ID = "login-sso-hint"

/**
 * Maskotun çapı (px) ekranın boyuna göre: sahne (başlık → Bağlan → telif) ilk ekranı doldursun ama
 * taşmasın. Atlas'ta robot sahnenin en büyük öğesi; burada da öyle.
 */
function useMascotSize() {
  const phone = useIsMobile()
  const tiny = useMediaQuery("(max-height: 520px)")
  const low = useMediaQuery("(max-height: 720px)")
  const mid = useMediaQuery("(max-height: 820px)")
  const tall = useMediaQuery("(min-height: 960px)")
  const tallPhone = useMediaQuery("(min-height: 880px)")
  if (tiny) return 84
  if (phone) return low ? 160 : tallPhone ? 250 : 215
  if (low) return 170
  if (mid) return 200
  return tall ? 300 : 260
}

/**
 * GİRİŞ EKRANI "TYRO ile tanış" (`/login`) — WorkOS Atlas açılışının düzeni ve açılışı: beyaz
 * zemin (tema ne olursa olsun), sol üstte marka bloğu, sağ üstte gezinme, ortada iki satır başlık
 * ("TYRO" paletin renginde), alt yazı, maskot, Bağlan ve telif. Açılışta maskot ortada büyük
 * belirir, yerine çekilirken yazılar kelime kelime akar, düğmeler en son gelir (`loginMotion`).
 * Bağlan'da çerçeve söner, maskot ortada çöker, "CONNECTING TO TYRO" dizilir; zemin hep beyaz.
 * Seçilmiş dil yoksa İngilizce açılır (uygulama Türkçe: `lib/i18nDictionaries` ›
 * defaultLocaleFor). Ayrıntı: docs/features/giris.md.
 */
export function LoginPage() {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const phone = useIsMobile()
  const size = useMascotSize()
  const { busy, connect, attempt } = useLoginConnect()
  const mood = useLoginMood(busy)
  const dir = locale === "ar" ? "rtl" : undefined
  // Yeniden deneme açılışı tekrar oynatmaz: çerçeve hemen yerinde.
  const at = attempt > 0 ? 0 : INTRO.textAt

  useEffect(() => {
    const previous = document.title
    document.title = `${t("meet.pageTitle")} · TYRO`
    return () => {
      document.title = previous
    }
  }, [t])

  return (
    <div className="login-page" key={attempt}>
      <LoginHeader reduce={reduce} leaving={busy} at={at} />
      <main className="login-main">
        <LoginTitle reduce={reduce} leaving={busy} at={at} />
        <motion.p className="login-sub" dir={dir} {...reveal(reduce, at + 0.25, busy)}>
          {t("login.motto")} {t("login.mottoEnd")}
        </motion.p>
        <LoginStage
          size={size}
          mood={mood}
          phone={phone}
          reduce={reduce}
          leaving={busy}
          intro={attempt === 0}
        />
        <motion.div {...reveal(reduce, at + 0.55, busy)}>
          <LoginConnect busy={busy} onConnect={connect} describedBy={HINT_ID} />
        </motion.div>
        <span id={HINT_ID} className="sr-only">
          {t("login.ssoHint")}
        </span>
      </main>
      <motion.footer className="login-foot" {...reveal(reduce, at + 0.75, busy)}>
        {t("login.copyright", { year: new Date().getFullYear() })}
      </motion.footer>
      {/* Geçiş ekranda yalnız maskot ve yazı; ekran okuyucu bağlanıldığını duyar. */}
      {busy && (
        <span className="sr-only" aria-live="polite">
          {t("login.connectingTitle")}
        </span>
      )}
    </div>
  )
}

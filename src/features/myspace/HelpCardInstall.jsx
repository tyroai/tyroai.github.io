import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Download01Icon from "@hugeicons/core-free-icons/Download01Icon"
import { TyroAppIcon } from "@/components/brand/TyroAppIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { promptInstall, setInstallGuide } from "@/lib/pwaInstall"

import { BTN, BTN_FILL, FOCUS } from "./orb/heldButton"

const KICKER = "text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-brand"

/**
 * Yardım kartını DEVRALAN kurulum önerisi (`useInstallPromo`): maskot kenardan "TYRO'yu yükle"
 * kartı uzatır — ekip kutlamasının kartıyla aynı sahne ve aynı ölçüler (`HelpCardColleagues`).
 * Yükle tarayıcının penceresini açar, iPhone/iPad Safari'de iki adımlı tarifi
 * (`IosInstallGuide`). Köşedeki × ("Şimdi değil") ve o pencerede vazgeçmek kartı bu oturumda
 * kapatır (yüklü değilse sonraki oturum yine önerir); kurulunca kart kendiliğinden çekilir
 * (`appinstalled`). Kart 1280'de ~176 px'e iniyor: iki
 * düğme yan yana sığmadığı için vazgeçme köşede. Slaytlar arasındaysa `next` (ok) Yükle'nin yanında.
 */
export function HelpCardInstall({ ios, onDismiss, next = null }) {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const touch = useMediaQuery("(pointer: coarse)")
  const install = async () => {
    if (ios) setInstallGuide(true)
    else if ((await promptInstall()) === "dismissed") onDismiss()
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotate: reduce ? 0 : -1, scale: 1 }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
      style={{ transformOrigin: "100% 100%" }}
      className="pointer-events-auto relative rounded-[1.25rem] bg-popover p-4 text-popover-foreground shadow-[0_20px_40px_-20px_rgb(0_0_0/0.5)] ring-1 ring-black/5"
    >
      <div className="flex items-center gap-3">
        <TyroAppIcon className="size-11" />
        <div className="min-w-0 flex-1">
          <p lang={locale} className={KICKER}>
            {t("pwa.promo.kicker")}
          </p>
          <p className="mt-0.5 text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em]">
            {t("pwa.menu.install")}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("pwa.promo.later")}
          title={t("pwa.promo.later")}
          className={`-me-1.5 -mt-1.5 grid size-7 shrink-0 place-items-center self-start rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground pointer-coarse:size-11 ${FOCUS}`}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
        </button>
      </div>
      <p className="mt-2 text-[0.75rem] leading-snug text-muted-foreground">
        {t(ios ? "pwa.promo.bodyIos" : touch ? "pwa.promo.bodyPhone" : "pwa.promo.body")}
      </p>
      <div className="mt-3.5 flex items-center gap-1.5 pe-14">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={install} className={`${BTN} ${BTN_FILL}`}>
              <HugeiconsIcon
                icon={Download01Icon}
                className="size-3.5"
                strokeWidth={2}
                aria-hidden="true"
              />
              {t(ios ? "pwa.promo.how" : "pwa.promo.install")}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[0.75rem]">
            {t(ios ? "pwa.promo.tipIos" : "pwa.promo.tip")}
          </TooltipContent>
        </Tooltip>
        {next}
      </div>
    </motion.div>
  )
}

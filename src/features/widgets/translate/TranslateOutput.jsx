import "@/lib/i18n/tools"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import Tick01Icon from "@hugeicons/core-free-icons/Tick01Icon"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { languageName } from "@/lib/onDeviceTranslate"

const PCT = { style: "percent", maximumFractionDigits: 0 }

/**
 * Çevir kartının sonucu: çalışırken durum (dil paketi iniyorsa yüzde), bitince "Rusça → Türkçe",
 * çeviri ve kopyala (`onCopy`, kartla ortak); anlaşılamadı, çift yok ya da hata olursa TYRO'ya sorma
 * düğmesi. Boştayken yalnız gizlilik notu (cihazda çevrilir) ya da tarayıcı çeviremiyorsa bunu
 * söyleyen satır. Dar kartın sonuç kipinde baş satır gizli: dil özette ve haplarda, Kopyala çubukta.
 */
export function TranslateOutput({ state, device, copied, onCopy, onChat }) {
  const { t, locale } = useLocale()
  const name = (code) => languageName(code, locale)

  if (state.status === "idle")
    return (
      <p className="tw-note">
        {device === false ? t("tools.translate.noDevice") : t("tools.translate.private")}
      </p>
    )

  if (state.status === "working")
    return (
      <p role="status" className="tw-note tw-working">
        <HugeiconsIcon icon={Loading03Icon} aria-hidden="true" strokeWidth={2} />
        {state.progress != null
          ? t("myspace.translate.downloading", {
              p: getNumberFormat(locale, PCT).format(state.progress),
            })
          : t("myspace.translate.working")}
      </p>
    )

  if (state.status !== "done") {
    const message =
      state.status === "unknown"
        ? t("myspace.translate.unknown")
        : state.status === "unsupported"
          ? t("myspace.translate.unsupported", { from: name(state.source), to: name(state.target) })
          : t("myspace.translate.error")
    return (
      <div className="tw-out">
        <p role="status" className="tw-note">
          {message}
        </p>
        <button type="button" onClick={onChat} className="tw-chip">
          {t("tools.translate.goChat")}
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="tw-out">
      <div className="tw-head">
        <span className="tw-pair">
          {name(state.source)}
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" strokeWidth={2} />
          {name(state.target)}
        </span>
        <button type="button" onClick={onCopy} className="tw-chip">
          <HugeiconsIcon
            icon={copied ? Tick01Icon : Copy01Icon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
          {t("myspace.translate.copy")}
        </button>
      </div>
      <p lang={state.target} dir="auto" aria-live="polite" data-private="" className="tw-text">
        {state.text}
      </p>
    </div>
  )
}

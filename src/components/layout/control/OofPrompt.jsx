import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import MailReply01Icon from "@hugeicons/core-free-icons/MailReply01Icon"
import { useLocale } from "@/hooks/useLocale"
import { removeOof, setUpOof } from "./oofActions"
import { rangeText } from "./oofText"
import { useOof } from "./useOof"

/**
 * "İznin onaylandı — otomatik yanıt kurulsun mu?" (ızgaranın üstünde, "Toplantıya katıl" gibi;
 * cevaplanana kadar durur; aynı soru çanın listesinde de): *Kur* hazır metinle planlar, × "bu
 * izin için sorma". TYRO'nun kurduğu yanıtın izni kalmadıysa (iptal) kaldırmayı sorar. Yanıt asla
 * kendiliğinden kurulmaz.
 */
export function OofPrompt() {
  const { t, locale } = useLocale()
  const oof = useOof()
  const { ask } = oof
  if (!ask) return null
  if (ask.kind === "clear") {
    return (
      <div className="cc-join" data-kind="oof">
        <span className="cc-ic" aria-hidden="true">
          <HugeiconsIcon icon={MailReply01Icon} strokeWidth={1.8} />
        </span>
        <span className="cc-text">
          <span className="cc-label">{t("control.oof.mismatch")}</span>
        </span>
        <button
          type="button"
          className="cc-pill"
          data-tone="prominent"
          onClick={() => removeOof(oof, t)}
        >
          {t("control.oof.remove")}
        </button>
      </div>
    )
  }
  const range = rangeText(locale, ask.leave.start, ask.leave.end)
  return (
    <div className="cc-join" data-kind="oof">
      <span className="cc-ic" aria-hidden="true">
        <HugeiconsIcon icon={MailReply01Icon} strokeWidth={1.8} />
      </span>
      <span className="cc-text">
        <span className="cc-label" data-private="">
          {t("control.oof.askShort", { range })}
        </span>
        <span className="cc-sub">{t("control.oof.askSub")}</span>
      </span>
      <button
        type="button"
        className="cc-pill"
        data-tone="prominent"
        onClick={() => setUpOof(oof, ask.leave, t, locale)}
      >
        {t("control.oof.setUp")}
      </button>
      <button
        type="button"
        className="cc-icon-btn"
        aria-label={t("control.oof.skip")}
        title={t("control.oof.skip")}
        onClick={() => oof.skip(ask.leave)}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

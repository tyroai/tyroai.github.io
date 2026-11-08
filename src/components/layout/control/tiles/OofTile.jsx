import { HugeiconsIcon } from "@hugeicons/react"
import MailReply01Icon from "@hugeicons/core-free-icons/MailReply01Icon"
import { useLocale } from "@/hooks/useLocale"
import { shownRange } from "../oofActions"
import { rangeText } from "../oofText"
import { useOof } from "../useOof"
import { TileShell } from "./TileShell"

/**
 * Otomatik yanıt (Outlook "ofis dışındayım"): durum — kapalı · açık · "12–16 Kasım planlı"; onaylı
 * yaklaşan izin için kurulmadıysa izni söyler, yanıtın izni kalmadıysa uyarır. Dokununca ayrıntı
 * (`OofDetail`): tarihler, metin, planla · aç · kapat.
 */
export function OofTile({ onOpen, ...shell }) {
  const { t, locale } = useLocale()
  const oof = useOof()
  const { ask, state } = oof
  const on = state?.kind === "on" || state?.kind === "active"
  const sub =
    ask?.kind === "set"
      ? t("control.oof.nudge", { range: rangeText(locale, ask.leave.start, ask.leave.end) })
      : ask?.kind === "clear"
        ? t("control.oof.mismatch")
        : state?.kind === "scheduled"
          ? t("control.oof.scheduled", { range: shownRange(locale, state) })
          : on
            ? t("control.oof.on")
            : oof.status === "ready"
              ? t("control.oof.off")
              : null
  return (
    <TileShell id="tool:oof" on={on} {...shell}>
      <button type="button" className="cc-hit" onClick={() => onOpen("tool:oof")}>
        <span className="cc-ic">
          <HugeiconsIcon icon={MailReply01Icon} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="cc-text">
          <span className="cc-label">{t("control.oof.title")}</span>
          {sub && (
            <span className="cc-sub" data-nudge={ask ? "" : undefined}>
              {sub}
            </span>
          )}
        </span>
      </button>
    </TileShell>
  )
}

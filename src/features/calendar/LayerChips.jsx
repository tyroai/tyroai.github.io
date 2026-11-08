import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { useCause } from "@/hooks/useCause"
import { useLocale } from "@/hooks/useLocale"
import { withCause } from "@/lib/causeText"
import { KINDS } from "@/features/calendar/lib/items"
import { useFitCount } from "./hooks/useFitCount"
import { AnchoredPopover } from "./AnchoredPopover"

/**
 * Katman çipleri (açıklama satırı): renk noktası + ad; tıklayınca katman açılır/kapanır. Kapalı
 * olan soluk, nokta boş halka (üstü çizili değil). Kaynağı OKUNAMAYAN ya da eksik okunan
 * katmanda küçük bir ipucu: boşluk "yok" demek değil, "soramadık". Bu kişide olmayan katman
 * (kapı kapalı, ekip yok) hiç çizilmez. Satır HEP TEK satır (sahibin isteği): sığmayan çipler
 * sondaki "+N" çipine toplanır, o da aynı aç/kapa düğmeleriyle küçük bir liste açar. Paylaşılan
 * takvimlerin kişileri burada değil, başlıktaki "Kişi ekle" düğmesinde (`PeopleButton`).
 */
function LayerTip({ state, detail }) {
  const { t } = useLocale()
  const cause = useCause(detail)
  const base = t(state === "failed" ? "calendar.page.layer.failed" : "calendar.page.layer.partial")
  return <InfoTip className="cal-info-tip" text={withCause(base, cause)} label={base} />
}

/** Tek katman: satırda çip, "+N" listesinde satır (`menu`; açıkken sağda ✓). */
export function LayerChip({ kind, layers, status, details, menu, spill, onToggle }) {
  const { t } = useLocale()
  const on = layers[kind] !== false
  return (
    <span className="cal-layer-wrap" data-fit={menu ? undefined : ""} data-spill={spill}>
      <button
        type="button"
        className="cal-layer"
        data-tone={kind}
        data-loading={status[kind] === "loading" || undefined}
        aria-pressed={on}
        onClick={() => onToggle(kind)}
      >
        <span className="cal-dot" aria-hidden="true" />
        {t(`calendar.page.layer.${kind}`)}
        {menu && on && (
          <HugeiconsIcon
            icon={Tick02Icon}
            className="cal-ic cal-layer-tick"
            strokeWidth={2.4}
            aria-hidden="true"
          />
        )}
      </button>
      {(status[kind] === "failed" || status[kind] === "partial") && (
        <LayerTip state={status[kind]} detail={details[kind]} />
      )}
    </span>
  )
}

export function LayerChips({ layers, status, details = {}, onToggle }) {
  const { t } = useLocale()
  const row = useRef(null)
  const [moreAt, setMoreAt] = useState(null)
  const kinds = useMemo(() => KINDS.filter((kind) => status[kind] !== "off"), [status])
  // Çip kümesi ya da yükleniyor/okunamadı durumu değişince yeniden ölçülür (ipucu çipi genişletir).
  const fit = useFitCount(row, kinds.map((k) => `${k}:${status[k]}`).join(","))
  const shown = Math.min(fit, kinds.length)
  const hidden = kinds.slice(shown)
  const chip = { layers, status, details, onToggle }
  return (
    <>
      <div
        ref={row}
        className="cal-layers"
        data-tour="cal-layers"
        role="group"
        aria-label={t("calendar.page.layers")}
      >
        {kinds.map((kind, i) => (
          <LayerChip key={kind} kind={kind} spill={i >= shown || undefined} {...chip} />
        ))}
        {/* "+N" hep çizilir (genişliği ölçülsün); her şey sığınca görünmez. */}
        <span className="cal-layer-wrap" data-fit-more="" data-spill={!hidden.length || undefined}>
          <button
            type="button"
            className="cal-layer cal-layer-more"
            aria-haspopup="dialog"
            aria-expanded={Boolean(moreAt)}
            aria-label={t("calendar.page.layer.more", {
              n: hidden.length,
              names: hidden.map((k) => t(`calendar.page.layer.${k}`)).join(", "),
            })}
            onClick={(e) => setMoreAt(e.currentTarget)}
          >
            +{hidden.length}
          </button>
        </span>
      </div>
      {moreAt && hidden.length > 0 && (
        <AnchoredPopover
          anchor={moreAt}
          title={t("calendar.page.layer.moreTitle")}
          className="cal-pop cal-pop-layers"
          align="end"
          onClose={() => setMoreAt(null)}
        >
          <div className="cal-layer-menu" role="group" aria-label={t("calendar.page.layers")}>
            {hidden.map((kind) => (
              <LayerChip key={kind} kind={kind} menu {...chip} />
            ))}
          </div>
        </AnchoredPopover>
      )}
    </>
  )
}

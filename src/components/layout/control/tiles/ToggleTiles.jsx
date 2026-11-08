import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import ViewOffSlashIcon from "@hugeicons/core-free-icons/ViewOffSlashIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"
import { useTheme } from "@/hooks/useTheme"
import { FOCUS_DEFAULT, setFocusMode, useFocusMode } from "@/lib/focusMode"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { setPresentMode, usePresentMode } from "@/lib/presentMode"
import { AppearanceGlyph } from "../ControlGlyph"
import { TileShell } from "./TileShell"

const TIME = { hour: "2-digit", minute: "2-digit" }

/**
 * Aç-kapa kutucuğunun yüzü (macOS'taki gibi sade): yalnız ad; durum satırı (`sub`) yalnız
 * söylenecek bir şey varken (açıkken bitiş saati, bu sayfada yoksa o). Ne işe yaradığı ipucu
 * balonunda (ekran okuyucuya açıklama olarak da gider). `disabled`: dokununca bir şey olmaz.
 */
export function ToggleFace({ icon, label, sub, hint, on, onToggle, disabled = false }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cc-hit"
          aria-pressed={on}
          aria-disabled={disabled || undefined}
          onClick={disabled ? undefined : onToggle}
        >
          <span className="cc-ic">
            <HugeiconsIcon icon={icon} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="cc-text">
            <span className="cc-label">{label}</span>
            {sub && <span className="cc-sub">{sub}</span>}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

/** Kutucuğun sağındaki ›: seçenekler ya da düzenleme (Odak süreleri, çentiği düzenle). */
export function MoreButton({ label, onClick }) {
  return (
    <button type="button" className="cc-more" aria-label={label} title={label} onClick={onClick}>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        aria-hidden="true"
        className="size-4 rtl:-scale-x-100"
      />
    </button>
  )
}

/**
 * Odak modu: dokununca bir saatliğine açılır ya da kapanır; sağdaki › süre seçeneklerini açar
 * (macOS'un Odak kutucuğu gibi). Açıkken durum satırında bitiş saati ya da "Gün boyu".
 */
export function FocusTile({ onOpen, ...shell }) {
  const { t, locale } = useLocale()
  const { until, choice } = useFocusMode()
  const on = until != null
  const sub = !on
    ? null
    : choice === "day"
      ? t("control.focus.allDay")
      : t("control.focus.until", { time: getDateTimeFormat(locale, TIME).format(until) })
  return (
    <TileShell id="toggle:focus" on={on} {...shell}>
      <ToggleFace
        icon={Moon02Icon}
        label={t("control.focus.short")}
        sub={sub}
        hint={t("control.focus.hint")}
        on={on}
        onToggle={() => setFocusMode(on ? null : FOCUS_DEFAULT)}
      />
      <MoreButton label={t("control.focus.more")} onClick={() => onOpen("toggle:focus")} />
    </TileShell>
  )
}

/** Sunum modu: ekran paylaşırken kişisel bilgiler bulanık, kendiliğinden gelen bildirim yok. */
export function PresentTile(shell) {
  const { t } = useLocale()
  const on = usePresentMode()
  return (
    <TileShell id="toggle:present" on={on} {...shell}>
      <ToggleFace
        icon={ViewOffSlashIcon}
        label={t("control.present.short")}
        sub={on ? t("control.present.on") : null}
        hint={t("control.present.hint")}
        on={on}
        onToggle={() => setPresentMode(!on)}
      />
    </TileShell>
  )
}

/**
 * Koyu görünüm (varsayılan tek hücre, yarısı dolu daire): açıkken yuva dolu. Küçükken ad ipucu
 * balonunda ve ekran okuyucuda (CSS gizler), ortada adı da görünür.
 */
export function ThemeTile(shell) {
  const { t } = useLocale()
  const { theme, toggle } = useTheme()
  const dark = theme === "dark"
  const label = t("control.theme.title")
  return (
    <TileShell id="toggle:theme" on={dark} {...shell}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="cc-hit" aria-pressed={dark} onClick={toggle}>
            <span className="cc-ic">
              <AppearanceGlyph />
            </span>
            <span className="cc-text">
              <span className="cc-label">{label}</span>
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TileShell>
  )
}

import { useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Link04Icon from "@hugeicons/core-free-icons/Link04Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"
import { useControlActions } from "../controlActions"
import { SHORTCUT_SLOTS, useShortcutItems } from "../shortcuts"
import { TileShell } from "./TileShell"

/**
 * Adı görünen kısa etiket (sesli komutla "Çentik" denince bulunsun — WCAG 2.5.3), uzun hali
 * açıklama: ipucu ve ekran okuyucu ("Çentiği düzenle").
 */
function Shortcut({ icon, label, tip, onClick }) {
  const tipId = useId()
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="cc-sc" aria-describedby={tipId} onClick={onClick}>
            <span className="cc-ic">
              <HugeiconsIcon icon={icon} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="cc-sc-label">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
      <span id={tipId} hidden>
        {tip}
      </span>
    </>
  )
}

/**
 * Kısayollar (Raycast'in hızlı bağlantıları gibi; tam genişlik, tek satır, panelin en altında):
 * çentiği düzenle, izin, masraf, toplantı, Anasayfa'yı düzenle ve kişinin kendi bağlantıları
 * (yeni sekmede). Altıncı
 * yuva beşten azsa "Bağlantı" (kendi bağlantılarını ekle), fazlaysa "Diğer" (hepsi ve yönetim
 * panelin içinde).
 */
export function ShortcutsTile({ onOpen, ...shell }) {
  const { t } = useLocale()
  const actions = useControlActions()
  const items = useShortcutItems()
  const overflow = items.length > SHORTCUT_SLOTS
  return (
    <TileShell id="tool:shortcuts" {...shell}>
      <div className="cc-shortcuts" role="group" aria-label={t("control.sc.title")}>
        {items.slice(0, SHORTCUT_SLOTS).map((it) => (
          <Shortcut
            key={it.id}
            icon={it.icon}
            label={it.translate ? t(it.label) : it.label}
            tip={it.translate ? t(it.tip) : it.tip}
            onClick={() => it.run(actions)}
          />
        ))}
        <Shortcut
          icon={overflow ? MoreHorizontalIcon : Link04Icon}
          label={t(overflow ? "control.sc.more" : "control.sc.link")}
          tip={t(overflow ? "control.sc.moreLong" : "control.sc.manage")}
          onClick={() => onOpen("tool:shortcuts")}
        />
      </div>
    </TileShell>
  )
}

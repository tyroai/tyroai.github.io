import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import HorizontalResizeIcon from "@hugeicons/core-free-icons/HorizontalResizeIcon"
import SquareArrowExpand01Icon from "@hugeicons/core-free-icons/SquareArrowExpand01Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"

/** Araç çubuğunun ikon düğmesi: görünen etiket yok, adı `aria-label` ve ipucu. */
export function BarButton({ icon, label, onClick }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground pointer-coarse:size-11"
        >
          <HugeiconsIcon icon={icon} className="size-[1.125rem]" strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Panelin pencere düğmeleri (`components/layout/dockBar`): genişlik yalnız masaüstünde (telefonda
 * panel sabit enli bir çekmece). Genişlik okları yalnız ENİ değiştirir; yanındaki kare sohbeti tam
 * sayfaya taşır — ikisi aynı glifi paylaşınca satır tek eylemin iki kez çizilmesi gibi okunuyordu.
 */
export function DockControls({ bar }) {
  const { t } = useLocale()
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {bar.canWiden && (
        <BarButton
          icon={HorizontalResizeIcon}
          label={t(bar.wide ? "chatDock.narrow" : "chatDock.widen")}
          onClick={bar.onWiden}
        />
      )}
      <BarButton
        icon={SquareArrowExpand01Icon}
        label={t("chatDock.openFull")}
        onClick={bar.onExpand}
      />
      <BarButton icon={Cancel01Icon} label={t("chatDock.close")} onClick={bar.onClose} />
    </div>
  )
}

/**
 * Sohbet boşken (karşılama) ya da ajana erişim kilitliyken panelin üst şeridi: yalnız pencere
 * düğmeleri. Karşılamada kahraman küre aşağıda, başlık tekrar etmez; kilitliyken içerik
 * etkileşimsiz bir katmanda, düğmeler onun DIŞINDA kalmalı — yoksa panel kapatılamazdı.
 */
export function DockBar({ bar }) {
  // Kutusu konuşma başlığınınkiyle aynı (`ChatScreen` dolgusu + `ChatHeader` satırı): ilk mesajla
  // düğmeler yerinden oynamasın.
  return (
    <div className="shrink-0 px-3 pt-2 pb-2 sm:px-4 sm:pt-3">
      <div className="flex min-h-10 items-center justify-end">
        <DockControls bar={bar} />
      </div>
    </div>
  )
}

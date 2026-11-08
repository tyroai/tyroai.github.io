import { HugeiconsIcon } from "@hugeicons/react"
import PlusSignCircleIcon from "@hugeicons/core-free-icons/PlusSignCircleIcon"
import { Button } from "@/components/ui/button"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { useLocale } from "@/hooks/useLocale"
import { BarButton, DockControls } from "./DockControls"

/**
 * Sohbetin TEK araç çubuğu: solda ajanın kimliği — küçük küre büyük kürenin modlarını (idle /
 * listening / thinking / speaking) yansıtır, adın altında açıklama, küre "thinking"teyken
 * "Yazıyor…" — sağda eylemler. Panelde (`bar`: `components/layout/dockBar`) yeni sohbet ikon
 * düğmesi olur ve ayraçtan sonra panelin pencere düğmeleri gelir; panelin ayrı "TYRO Sohbet"
 * satırı yok (ajanın adıyla iki başlık üst üste duruyordu). Yeni sohbetin simgesi kenar
 * çubuğundakiyle aynı (⊕): ↻ "yenile" gibi okunuyordu.
 */
export function ChatHeader({ orbState, level, onOrbClick, activeAgent, onReset, bar = null }) {
  const { t } = useLocale()
  return (
    <div className="relative shrink-0 border-b border-border/60 pb-2">
      <div className="flex items-center gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <BrandOrb
            surface="chat"
            state={orbState}
            level={level}
            size={30}
            onClick={onOrbClick}
            ariaLabel={t("chat.orb.aria")}
          />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold leading-4">{activeAgent?.name}</span>
            {orbState === "thinking" ? (
              <span className="truncate text-[0.6875rem] font-medium text-brand-ink">
                {t("chat.status.thinking")}
              </span>
            ) : activeAgent?.description ? (
              <span className="truncate text-[0.6875rem] text-muted-foreground">
                {activeAgent.description}
              </span>
            ) : null}
          </div>
        </div>
        {bar ? (
          <>
            <BarButton icon={PlusSignCircleIcon} label={t("chat.reset")} onClick={onReset} />
            <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border" />
            <DockControls bar={bar} />
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 w-8 shrink-0 gap-1.5 p-0 text-xs text-muted-foreground hover:text-foreground sm:w-auto sm:px-3"
            aria-label={t("chat.reset")}
          >
            <HugeiconsIcon icon={PlusSignCircleIcon} className="size-4 sm:size-3.5" />
            <span className="hidden sm:inline">{t("chat.reset")}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

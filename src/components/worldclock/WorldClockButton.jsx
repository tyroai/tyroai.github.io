import { cloneElement, lazy, Suspense, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import TimeZoneIcon from "@hugeicons/core-free-icons/TimeZoneIcon"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"

const loadDialog = () => import("./WorldClockDialog")
const WorldClockDialog = lazy(loadDialog)

/**
 * Dünya saati — sağ çentikte üçüncü düğme, "Saatler" (`trigger`: çentiğin kendi düğmesi, açma davranışı ona
 * eklenir); çentiğin ekranda olmadığı yerde (tablet, telefon, sohbet rıhtımı açık) header'da
 * ikon. Yerel saat ve tarih bildirim hapında (`SpecialDaysButton`). Pencere ilk basışta yüklenir —
 * üstüne gelince önden istenir, açılış beklemesin. Pencere Radix'in tetiğiyle açılmıyor: kapanınca
 * odağı açan düğmeye biz döndürürüz, yoksa sayfanın başına düşerdi.
 */
export function WorldClockButton({ trigger = null }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Açan düğme (çentikte ya da header'da): pencere kapanınca odak ona döner.
  const [back, setBack] = useState(null)
  const opener = {
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    onPointerEnter: loadDialog,
    onFocus: loadDialog,
    onClick: (e) => {
      setBack(e.currentTarget)
      setMounted(true)
      setOpen(true)
    },
  }
  const returnFocus = (e) => {
    e.preventDefault()
    back?.focus()
  }
  return (
    <>
      {trigger ? (
        // Çentik düğmesi seçili görünümünü `data-state`ten alır (popover tetikleri gibi).
        cloneElement(trigger, { ...opener, "data-state": open ? "open" : "closed" })
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              {...opener}
              aria-label={t("worldClock.title")}
              className="size-9 shrink-0 rounded-xl [&_svg]:!size-5 relative pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
            >
              <HugeiconsIcon icon={TimeZoneIcon} strokeWidth={1.8} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("worldClock.title")}</TooltipContent>
        </Tooltip>
      )}
      {mounted && (
        <Suspense fallback={null}>
          <WorldClockDialog open={open} onOpenChange={setOpen} onCloseAutoFocus={returnFocus} />
        </Suspense>
      )}
    </>
  )
}

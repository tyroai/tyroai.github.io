import "@/lib/i18n/tibot"
import { useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { TibotRow } from "./TibotRow"
import "./tibotWidget.css"
import { TIBOT_PATH } from "@/lib/tibotPolicy"

// Açılan listede en çok bu kadar talep; fazlası "Tümünü gör" ile Self Servis › Ticket'ta.
const MAX = 6

/**
 * Bir sayının arkasındaki talepler (Ticket özeti, karşılama, ritim): basınca açılan kart — başlık
 * ve sayı, en çok altı talep (gecikenler önce), "Tümünü gör". Talebe basınca kart kapanır, ayrıntı
 * bir kare sonra açılır (`onOpen`; odak yarışmasın). `children`: tetik (düğme).
 */
export function TibotStatPop({ title, items, bucket, onOpen, side = "bottom", children }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const shown = items.slice(0, MAX)
  const pick = (row) => {
    setOpen(false)
    requestAnimationFrame(() => onOpen({ ...row, bucket }))
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        sideOffset={8}
        collisionPadding={12}
        aria-label={title}
        className="tbw-pop w-80 rounded-2xl p-2"
      >
        <p className="tbw-pop-title">
          {title}
          <span className="tabular-nums text-muted-foreground">{items.length}</span>
        </p>
        {shown.length ? (
          <ul className="space-y-px">
            {shown.map((row) => (
              <TibotRow key={row.requestId} row={row} bucket={bucket} peek={false} onOpen={pick} />
            ))}
          </ul>
        ) : (
          <p className="tbw-pop-empty">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" strokeWidth={1.8} />
            {t("tibot.allClear")}
          </p>
        )}
        <Link to={TIBOT_PATH} className="tbw-pop-all" onClick={() => setOpen(false)}>
          {t("tibot.seeAll")}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-3.5 rtl:rotate-180"
            strokeWidth={2}
          />
        </Link>
      </PopoverContent>
    </Popover>
  )
}

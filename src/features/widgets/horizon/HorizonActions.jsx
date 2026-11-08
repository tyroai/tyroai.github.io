import { lazy, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import LeftToRightListBulletIcon from "@hugeicons/core-free-icons/LeftToRightListBulletIcon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { WidgetOverlay } from "../WidgetOverlay"

const HorizonAdd = lazy(() => import("./HorizonAdd"))
const HorizonLists = lazy(() => import("./HorizonLists"))

// Başlık satırının küçük ikon düğmesi: görünüşte 28 px, dokunmatikte görünmez payla 44 px.
const BTN =
  "relative grid size-7 place-items-center rounded-full text-muted-foreground transition outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent aria-expanded:text-foreground pointer-coarse:after:absolute pointer-coarse:after:-inset-2 [&_svg]:size-4"

/** Yeni hedef penceresi; tetik dışarıdan da verilebilir (boş durumun düğmesi). */
export function AddMilestone({ horizon, trigger, align = "end" }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const label = t("widgets.horizon.add")
  return (
    <WidgetOverlay
      title={label}
      open={open}
      onOpenChange={setOpen}
      align={align}
      trigger={
        trigger ?? (
          <button type="button" aria-label={label} title={label} className={BTN}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          </button>
        )
      }
    >
      <HorizonAdd horizon={horizon} onDone={() => setOpen(false)} />
    </WidgetOverlay>
  )
}

/** Liste seçimi penceresi; tetik dışarıdan da verilebilir (boş durumun "Tümü" düğmesi). */
export function PickLists({ horizon, trigger, align = "end" }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const label = t("widgets.horizon.lists")
  return (
    <WidgetOverlay
      title={label}
      open={open}
      onOpenChange={setOpen}
      align={align}
      trigger={
        trigger ?? (
          <button type="button" aria-label={label} title={label} className={BTN}>
            <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={1.9} />
          </button>
        )
      }
    >
      <HorizonLists horizon={horizon} />
    </WidgetOverlay>
  )
}

/** Başlık satırının işleri: yeni hedef (liste seçiliyse; dar kartta "+n" penceresinde) ve listeler. */
export function HorizonActions({ horizon, compact = false, className }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      {!compact && horizon.selected.length > 0 && <AddMilestone horizon={horizon} />}
      <PickLists horizon={horizon} />
    </span>
  )
}

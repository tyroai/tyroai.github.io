import "@/lib/i18n/bell"
import { useEffect, useState } from "react"
import { TrayOverlay } from "@/components/layout/headerWidgets/trayParts"
import { FLOATING } from "@/components/layout/headerWidgets/trayStyles"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { markBellSeen } from "@/lib/bellSeen"
import { cn } from "@/lib/utils"
import { BellButton } from "./BellButton"
import { bellHandoff } from "./bellIntent"
import { BellPanel } from "./BellPanel"
import "./bell.css"
import "./bellRows.css"

const trigger = () => document.querySelector("[data-bell-trigger]")

/**
 * BİLDİRİM PANELİ (çanın tembel parçası): masaüstünde ve tablette çandan yapışkan açılan pencere
 * (Denetim Merkezi'nin kardeşi: aynı yüzey, aynı açılış), telefonda alttan çekmece. Yer tutucuda
 * basılmışsa açık gelir, odak düğmede kalır. Açıkken görünen her şey okundu sayılır — panel
 * açıkken yüklenen kutlama da (`lib/bellSeen`).
 */
export default function BellCenter({ badge, data, feed, feedOpen, notice, specialKeys }) {
  const { t } = useLocale()
  const mobile = useIsMobile()
  const [open, setOpen] = useState(() => bellHandoff.open)
  const [refocus] = useState(() => bellHandoff.focused)

  useEffect(() => {
    bellHandoff.open = false
    bellHandoff.focused = false
    if (refocus) trigger()?.focus({ preventScroll: true })
  }, [refocus])

  useEffect(() => {
    if (open) markBellSeen({ day: data.todayIso, specialKeys, notice, feedItems: feed.items })
  }, [open, data.todayIso, specialKeys, notice, feed.items])

  return (
    <TrayOverlay
      mobile={mobile}
      open={open}
      onOpenChange={setOpen}
      title={t("bell.title")}
      align="end"
      className={cn(FLOATING, "w-auto")}
      trigger={<BellButton badge={badge} />}
    >
      <BellPanel
        mobile={mobile}
        data={data}
        feed={feed}
        feedOpen={feedOpen}
        notice={notice}
        onClose={() => setOpen(false)}
      />
    </TrayOverlay>
  )
}

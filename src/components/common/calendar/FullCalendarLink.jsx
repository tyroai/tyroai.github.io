import { Link, useLocation } from "react-router-dom"
import { PanelFooterAction } from "@/components/common/PanelFooterAction"
import { Separator } from "@/components/ui/separator"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"

/**
 * Header takvim panelinin dibindeki "Tam takvim": `/calendar` sayfasına götürür ve paneli kapatır
 * (`onNavigate`). Yalnız sayfayı açabilen kişide ve sayfanın dışındayken çizilir: kapıyı
 * `lib/pageAccess.js` verir, panel her sayfada bağlı ama kendine bağlantı anlamsız.
 */
export function FullCalendarLink({ onNavigate }) {
  const { t } = useLocale()
  const access = usePageAccess()
  const { pathname } = useLocation()
  if (!access.calendar || pathname === "/calendar") return null
  return (
    <>
      <Separator className="shrink-0" />
      <PanelFooterAction as={Link} to="/calendar" onClick={onNavigate}>
        {t("calendar.fullCalendar")}
      </PanelFooterAction>
    </>
  )
}

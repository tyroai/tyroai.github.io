import Compass01Icon from "@hugeicons/core-free-icons/Compass01Icon"
import CustomerSupportIcon from "@hugeicons/core-free-icons/CustomerSupportIcon"
import KeyboardIcon from "@hugeicons/core-free-icons/KeyboardIcon"
import { NavList } from "@/components/common/NavList"
import { useLocale } from "@/hooks/useLocale"
import { SHORTCUTS_ID, SUPPORT_ID, TOURS_ID, pageDomId } from "./helpContent"

/**
 * Masaüstü sol menüsü (iki bölmeli düzen): "Sayfalar" grubunda bu kişinin görebildiği sayfalar
 * (sayfa ikonlarıyla; yönetim sayfaları yalnız açabilene), altında Rehber turları, Kısayollar
 * (yalnız ince işaretçide, bölümün kendisi gibi) ve Destek. Kimlikler sayfadaki blok kimlikleridir;
 * tıklamayı sayfa yönetir (kendi kaydırıcısını kaydırır, bloğu açar).
 */
export function HelpNav({ current, onSelect, pages, shortcuts }) {
  const { t } = useLocale()
  const groups = [
    {
      id: "pages",
      label: t("help.nav.pages"),
      items: pages.map((p) => ({
        id: pageDomId(p.id),
        icon: p.icon,
        label: t(`help.pages.${p.id}.title`),
      })),
    },
    {
      id: "more",
      items: [
        { id: TOURS_ID, icon: Compass01Icon, label: t("help.nav.tours") },
        shortcuts && { id: SHORTCUTS_ID, icon: KeyboardIcon, label: t("help.nav.shortcuts") },
        { id: SUPPORT_ID, icon: CustomerSupportIcon, label: t("help.nav.support") },
      ].filter(Boolean),
    },
  ]
  return (
    <NavList label={t("help.nav.aria")} groups={groups} current={current} onSelect={onSelect} />
  )
}

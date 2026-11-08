import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import { Fab } from "@/components/common/Fab"
import { useLocale } from "@/hooks/useLocale"

/** Telefonda "Kişi ekle" — ortak yüzen düğme (`Fab`); son satırları etiketle örtmez. */
export function AddPersonFab({ onClick }) {
  const { t } = useLocale()
  return <Fab icon={UserAdd01Icon} label={t("security.add")} onClick={onClick} />
}

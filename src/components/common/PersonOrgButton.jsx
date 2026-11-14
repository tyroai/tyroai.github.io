import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import HierarchyIcon from "@hugeicons/core-free-icons/HierarchyIcon"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { rememberQuery } from "@/lib/filesNav"
import { orgPath } from "@/lib/findScope"

/**
 * Kişi kartının "Organizasyonda gör"ü: Bul › Kişiler'de ağaç bu kişiye odaklı açılır (yönetici
 * zinciri ve bağlıları). Kimlik bilinmiyorsa (profil okunamadı) ya da Keşfet kapalıysa çizilmez.
 */
export function PersonOrgButton({ id, onDone }) {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { canOpen } = usePageAccess()
  if (!id || !canOpen("/feed")) return null
  return (
    <button
      type="button"
      onClick={() => {
        rememberQuery("")
        onDone?.()
        navigate(orgPath(id))
      }}
      className="pc-btn"
    >
      <HugeiconsIcon icon={HierarchyIcon} strokeWidth={2} aria-hidden="true" />
      {t("find.org.open")}
    </button>
  )
}

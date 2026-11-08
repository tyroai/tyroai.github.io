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
      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[0.75rem] font-semibold text-foreground/85 transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:h-11"
    >
      <HugeiconsIcon icon={HierarchyIcon} className="size-3.5" strokeWidth={2} aria-hidden="true" />
      {t("find.org.open")}
    </button>
  )
}

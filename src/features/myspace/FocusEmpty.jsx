import { HugeiconsIcon } from "@hugeicons/react"
import Target02Icon from "@hugeicons/core-free-icons/Target02Icon"
import { useLocale } from "@/hooks/useLocale"

/**
 * Bugünün odağının boş hâli (empty state): küçük, süzülen bir hedef ve tek satır soru. Kartın BOŞ
 * alanına üstten yerleşir (`absolute`) — satırın yüksekliğine katkısı yok. Alan dar kalırsa (< 6rem)
 * simge gizlenir. Süzülme CSS döngüsü (`.focus-float`, intro.css): dinlenme modu durdurabilsin,
 * hareket azaltılmışsa durağan.
 */
export function FocusEmpty() {
  const { t } = useLocale()
  return (
    <div className="relative min-h-0 flex-1 [container-type:size]">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden text-center">
        <div className="relative size-10 shrink-0 [@container(max-height:6rem)]:hidden">
          <span
            aria-hidden="true"
            className="focus-float absolute inset-0 grid place-items-center rounded-xl bg-gradient-to-br from-brand-from/15 via-brand-via/15 to-brand-to/20 text-brand"
          >
            <HugeiconsIcon icon={Target02Icon} className="size-5" strokeWidth={1.8} />
          </span>
        </div>
        <p className="text-[0.8125rem] leading-snug text-muted-foreground">
          {t("myspace.tasks.empty")}
        </p>
      </div>
    </div>
  )
}

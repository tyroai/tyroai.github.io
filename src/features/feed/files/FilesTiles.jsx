import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { CHIP } from "./chipStyle"
import { useEdgeFade } from "./useEdgeFade"

/**
 * PANONUN ÇİPLERİ (2026-10-01).
 *
 * `TypeChips` — "Son 25 dosyanda: Excel 9 · Word 5…": her çip bir süzgeç
 * kapısı. Nokta satırdaki rozetin Office rengi; rengin tek başına anlam
 * taşımadığı için yanında adı ve sayısı.
 *
 * `FolderChips` — klasör kapıları: aramada "sonuçların bulunduğu klasörler",
 * panoda (2026-10-02'den beri) "sık kullandığın klasörler". Panodaki altı
 * kutucukluk ızgara (`FolderDoorTile`, ~140 px) tek satır çipe döndü —
 * istek: *"çok buton, çok kart göz yorar… tek büyük kart ve sonra listeler"*.
 */
/**
 * Tür kapıları — çerçevesiz, sessiz bağlantılar ("● Excel 10"); tek satır, sığmazsa yana kayar
 * ve kesik kenar solar. `mix` = `recentTypeMix`; `approx` sayılar sunucunun tahmini ("≈").
 */
export function TypeChips({ lead, mix, approx = false, onPick, note }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const rowRef = useRef(null)
  const fade = useEdgeFade(rowRef)
  if (!mix?.length) return null
  return (
    <div ref={rowRef} data-fade={fade} className="files-type-row">
      {lead && <span className="files-type-lead">{lead}</span>}
      {mix.map((m) => {
        const type = t(`myfiles.type.${m.id}`)
        const count = approx ? `≈\u00a0${num.format(m.n)}` : num.format(m.n)
        return (
          // Ad görünen metin ("Excel 10", WCAG 2.5.3); ne yaptığı ipucunda.
          <button
            key={m.id}
            type="button"
            onClick={() => onPick(m.id)}
            title={t("myfiles.mix.chipAria", { type, count })}
            className="files-type-link"
          >
            <span aria-hidden="true" className="files-filter-dot" style={{ background: m.tone }} />
            {type} <span className="files-filter-count">{count}</span>
          </button>
        )
      })}
      {note && <span className="files-type-lead">{note}</span>}
    </div>
  )
}

/** Klasör kapıları — aynı hap dili; arama sonuçlarının klasörleri (sarar). Panoda `FolderChipsFit`. */
export function FolderChips({ folders, onPick, pendingKey, labelFor, nameFor, ariaFor, lead }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {lead && (
        <span className="mr-1 shrink-0 text-[0.8125rem] font-medium text-muted-foreground">
          {lead}
        </span>
      )}
      {folders.map((f) => (
        <FolderChip
          key={f.url}
          folder={f}
          onPick={onPick}
          pending={pendingKey === f.url}
          root={labelFor(f)}
          name={nameFor ? nameFor(f) : f.name}
          aria={ariaFor?.(f)}
        />
      ))}
    </div>
  )
}

/** Tek klasör çipi: simge (bekliyorsa dönen), ad, kök (geniş kapsayıcıda) ve sayı. */
export function FolderChip({ folder, onPick, pending = false, root, name, aria, className }) {
  const { locale } = useLocale()
  const num = getNumberFormat(locale)
  return (
    <button
      type="button"
      onClick={() => !pending && onPick?.(folder)}
      aria-busy={pending || undefined}
      // Ad görünen metin (WCAG 2.5.3); sayının ne olduğu ipucunda.
      title={aria}
      className={cn(CHIP, "shrink-0", pending && "cursor-progress opacity-60", className)}
    >
      <HugeiconsIcon
        icon={pending ? Loading03Icon : Folder01Icon}
        className={cn(
          "size-3.5 shrink-0 text-muted-foreground",
          pending && "animate-spin motion-reduce:animate-none",
        )}
        strokeWidth={1.9}
      />
      <span className="truncate">{name}</span>
      {root && (
        <span className="hidden truncate text-muted-foreground @[30rem]/files:inline">
          · {root}
        </span>
      )}
      <span className="tabular-nums text-muted-foreground">{num.format(folder.count)}</span>
    </button>
  )
}

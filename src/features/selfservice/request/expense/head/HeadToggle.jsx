import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import TaskEdit01Icon from "@hugeicons/core-free-icons/TaskEdit01Icon"
import { cn } from "@/lib/utils"
import { IconTile } from "../../field/IconTile"
import { PILL } from "./headUi"
import "../../field/fieldTile.css"

/**
 * Dar kapta (telefon çekmecesi) başlığın katlı karosu: "Masraf bilgileri" ve altında özet
 * ("Ayşe Demir · Ekim 26 | TYRO Self Servis | Ayşe Demir"); basınca üç alan karosu altında açılır.
 * Açıkken özet söner, karo bölüm başlığı olur (değerler artık karolarda). Üç alanın da değeri
 * hep dolu (varsayılanlar): ikon kutusunda ✓. Geniş kapta görünmez.
 */
export function HeadToggle({ id, controls, open, onToggle, label, pill, summary }) {
  return (
    <button
      id={id}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className="req-tile group/toggle relative flex min-h-[3.75rem] w-full min-w-0 items-center gap-3 rounded-[0.875rem] px-3 py-2 text-start outline-none [-webkit-tap-highlight-color:transparent] pointer-coarse:min-h-16 @[40rem]/head:hidden"
    >
      <IconTile icon={TaskEdit01Icon} state="done" />
      <span className="min-w-0 flex-1">
        <span className="flex min-h-5 min-w-0 items-center gap-1.5 text-[0.75rem] leading-4 text-muted-foreground group-aria-expanded/toggle:text-[0.875rem] group-aria-expanded/toggle:font-semibold group-aria-expanded/toggle:text-foreground">
          <span className="truncate">{label}</span>
          {/* Açıkken etiket "Kimin adına" karosunda; burada ikinci kez durmasın. */}
          {pill && <span className={cn(PILL, "group-aria-expanded/toggle:hidden")}>{pill}</span>}
        </span>
        <span className="grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-aria-expanded/toggle:grid-rows-[0fr] group-aria-expanded/toggle:opacity-0">
          <span className="min-h-0 overflow-hidden">
            <span className="block min-w-0 truncate text-[0.9375rem] font-semibold leading-5 tracking-[-0.005em]">
              {summary}
            </span>
          </span>
        </span>
      </span>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        aria-hidden="true"
        strokeWidth={2}
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
          open && "rotate-180",
        )}
      />
    </button>
  )
}

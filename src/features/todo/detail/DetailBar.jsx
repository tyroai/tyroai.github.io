import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import { RecordBar, RecordButton } from "@/components/record-window/RecordBar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { listIcon } from "../listIcon"

/**
 * Ayrıntının üst şeridi: solda kapat ve görevin listesi (glifiyle), sağda yıldız (önemli aç/kapa)
 * ve "⋯" (Görevi sil). Silme onay kutusu menü kapandıktan SONRA açılır (`onCloseAutoFocus`): odak
 * önce "⋯"e döner, kutu kapanınca da oraya geri gelir.
 */
export function DetailBar({ task, list, locked, onClose, onToggleStar, onDelete }) {
  const { t } = useLocale()
  const deleting = useRef(false)
  const high = task.importance === "high"
  return (
    <RecordBar
      title={
        list ? (
          <span className="td-bar-list" title={list.name}>
            <HugeiconsIcon icon={listIcon(list)} aria-hidden="true" strokeWidth={1.9} />
            <span className="td-bar-list-name">{list.name}</span>
          </span>
        ) : (
          t("todo.detail.title")
        )
      }
      onClose={onClose}
      closeLabel={t("sheet.close")}
    >
      <RecordButton
        icon={StarIcon}
        variant="icon"
        className="td-star"
        data-on={high || undefined}
        disabled={locked}
        onClick={onToggleStar}
        aria-pressed={high}
        aria-label={high ? t("todo.star.off") : t("todo.star.on")}
        title={high ? t("todo.star.off") : t("todo.star.on")}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <RecordButton
            icon={MoreHorizontalIcon}
            variant="icon"
            disabled={locked}
            aria-label={t("todo.menu.open")}
            title={t("todo.menu.open")}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-52"
          onCloseAutoFocus={() => {
            if (!deleting.current) return
            deleting.current = false
            onDelete()
          }}
        >
          <DropdownMenuItem
            variant="destructive"
            className="pointer-coarse:min-h-11"
            onSelect={() => (deleting.current = true)}
          >
            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" strokeWidth={1.8} />
            {t("todo.detail.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </RecordBar>
  )
}

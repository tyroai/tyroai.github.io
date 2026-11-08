import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { CountText } from "./CountText"
import { listIcon } from "./listIcon"
import { VIEW_META } from "./viewMeta"

/**
 * To-Do'nun RAYI: akıllı görünümler + kişinin listeleri (yeni liste, yeniden adlandır, sil).
 * Geniş panoda listenin solunda; telefonda görünüm seçicinin çekmecesinde (`TodoMobileBar`).
 */
/* ─── Ray: görünümler + listeler ──────────────────────────────────────── */

function RailButton({ active, icon, label, count, onClick, tone, trailing }) {
  return (
    <div className="group/rail relative">
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        data-rail-trailing={trailing ? "" : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[0.8125rem] outline-none transition pointer-coarse:min-h-11",
          "focus-visible:ring-2 focus-visible:ring-brand/30",
          active
            ? "bg-brand/[0.09] font-semibold text-foreground"
            : "text-foreground/75 hover:bg-foreground/[0.04] hover:text-foreground",
        )}
      >
        <HugeiconsIcon
          icon={icon}
          className={cn("size-4 shrink-0", active ? "text-brand" : "text-muted-foreground")}
          strokeWidth={1.9}
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count > 0 && (
          <span
            className={cn(
              "shrink-0 text-[0.6875rem] tabular-nums",
              tone === "overdue"
                ? "font-semibold text-amber-700 dark:text-amber-400"
                : "text-muted-foreground",
              trailing && "group-hover/rail:opacity-0",
            )}
          >
            <CountText n={count} />
          </span>
        )}
      </button>
      {trailing}
    </div>
  )
}

function ListMenu({ list, onRename, onDelete }) {
  const { t } = useLocale()
  if (list.kind !== "custom" || !list.isOwner) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("todo.lists.menu")}
          className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 pointer-coarse:size-11 place-items-center rounded-lg text-muted-foreground opacity-0 outline-none transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/rail:opacity-100 data-[state=open]:opacity-100 [@media(pointer:coarse)]:opacity-100"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onRename(list)}>
          <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" strokeWidth={1.8} />
          {t("todo.lists.rename")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(list)}>
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
          {t("todo.lists.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InlineName({ initial = "", placeholder, onSubmit, onCancel }) {
  const [value, setValue] = useState(initial)
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
      className="px-1"
    >
      <input
        ref={ref}
        value={value}
        maxLength={120}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => (value.trim() ? onSubmit(value) : onCancel())}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        className="no-ios-zoom w-full rounded-xl border border-brand/40 bg-background px-3 py-2 text-[0.8125rem] outline-none ring-2 ring-brand/10"
      />
    </form>
  )
}

export function Rail({ board, view, counts, today, onView, onDeleteList }) {
  const { t } = useLocale()
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState(null)

  async function create(name) {
    setCreating(false)
    const list = await board.addList(name)
    if (list) onView(`list:${list.id}`)
  }

  return (
    <nav aria-label={t("todo.view.aria")} className="flex flex-col gap-0.5">
      {VIEW_META.map((v) => (
        <RailButton
          key={v.id}
          active={view === v.id}
          icon={v.icon}
          label={t(`todo.view.${v.id}`)}
          count={v.id === "done" ? 0 : counts[v.id]}
          tone={
            v.id === "today" && board.tasks.some((x) => !x.done && x.dueKey && x.dueKey < today)
              ? "overdue"
              : undefined
          }
          onClick={() => onView(v.id)}
        />
      ))}
      <div className="mx-3 my-3 h-px bg-border" />
      <p
        className="px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        lang={undefined}
      >
        {t("todo.lists.title")}
      </p>
      {board.lists.map((l) =>
        renaming === l.id ? (
          <InlineName
            key={l.id}
            initial={l.name}
            onSubmit={(name) => {
              setRenaming(null)
              board.renameList(l.id, name)
            }}
            onCancel={() => setRenaming(null)}
          />
        ) : (
          <RailButton
            key={l.id}
            active={view === `list:${l.id}`}
            icon={listIcon(l)}
            label={l.unreadable ? `${l.name} · ${t("todo.lists.unreadable")}` : l.name}
            count={counts[`list:${l.id}`]}
            onClick={() => onView(`list:${l.id}`)}
            trailing={
              <ListMenu list={l} onRename={(x) => setRenaming(x.id)} onDelete={onDeleteList} />
            }
          />
        ),
      )}
      {creating ? (
        <InlineName
          placeholder={t("todo.lists.newPlaceholder")}
          onSubmit={create}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[0.8125rem] text-brand outline-none pointer-coarse:min-h-11 transition hover:bg-brand/[0.06] focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          {t("todo.lists.new")}
        </button>
      )}
    </nav>
  )
}

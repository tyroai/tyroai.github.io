import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon"
import ViewOffSlashIcon from "@hugeicons/core-free-icons/ViewOffSlashIcon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Copy02Icon from "@hugeicons/core-free-icons/Copy02Icon"
import LinkSquare02Icon from "@hugeicons/core-free-icons/LinkSquare02Icon"
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon"
import { BottomSheet } from "@/components/common/BottomSheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { afterBackSettles } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { hostOf, isShown } from "./catalogLogic"

const ICON = "size-4 text-muted-foreground"
// Kısayol etiketi platformun diliyle (Self Servis › ShortcutHelp ile aynı): Mac'te ⌥.
const ALT =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")
    ? "⌥"
    : "Alt "
// Dokunmatikte 44 px satır (geniş dokunmatik ekranda açılır menü kalır); yazı formla aynı boyda.
const ITEM = "gap-2.5 py-1.5 text-[0.8125rem] pointer-coarse:min-h-11"
const TRIGGER =
  "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground pointer-coarse:size-11"

/**
 * Menünün işleri, gruplu (ayraçla ayrılır). `now`: dokunuşun içinde hemen çalışmalı — pano
 * yazma ve yeni sekme kullanıcı hareketi ister; öteki işler (yeni çekmece/kutu, sayfa geçişi)
 * telefonda menü çekmecesinin Geri adımı geri alındıktan sonra çalışır.
 */
function rowActions(p, t) {
  const shown = isShown(p.item)
  const ids =
    p.kind === "agents" ? ["tenantId", "clientId", "agentId"].filter((k) => p.item[k]) : []
  const recordId = t("settings.catalog.row.recordId")
  return [
    [
      { key: "edit", icon: Edit02Icon, label: t("settings.catalog.row.edit"), run: p.onEdit },
      {
        key: "dup",
        icon: Copy02Icon,
        label: t("settings.catalog.row.duplicate"),
        run: p.onDuplicate,
      },
      // Denemek için: uygulamanın adresi yeni sekmede, açık asistan sohbette.
      p.kind !== "agents" &&
        hostOf(p.item.url) && {
          key: "link",
          icon: LinkSquare02Icon,
          label: t("settings.catalog.row.openLink"),
          run: p.onOpenLink,
          now: true,
        },
      p.kind === "agents" &&
        shown && {
          key: "chat",
          icon: BubbleChatIcon,
          label: t("settings.catalog.row.tryInChat"),
          run: p.onTryChat,
        },
    ],
    [
      !p.isFirst && {
        key: "up",
        icon: ArrowUp01Icon,
        label: t("settings.catalog.row.moveUp"),
        run: () => p.onMove(-1),
        shortcut: `${ALT}↑`,
        now: true,
      },
      !p.isLast && {
        key: "down",
        icon: ArrowDown01Icon,
        label: t("settings.catalog.row.moveDown"),
        run: () => p.onMove(1),
        shortcut: `${ALT}↓`,
        now: true,
      },
      {
        key: "toggle",
        icon: shown ? ViewOffSlashIcon : ViewIcon,
        label: t(shown ? "settings.catalog.row.hide" : "settings.catalog.row.show"),
        run: p.onToggle,
        now: true,
      },
    ],
    [
      ...ids.map((k) => {
        const label = t(`settings.field.${k}`)
        return {
          key: k,
          icon: Copy01Icon,
          label: t("settings.catalog.row.copy").replace("{name}", label),
          run: () => p.onCopy(label, p.item[k]),
          now: true,
        }
      }),
      {
        key: "id",
        icon: Copy01Icon,
        label: t("settings.catalog.row.copy").replace("{name}", recordId),
        run: () => p.onCopy(recordId, String(p.item.id)),
        now: true,
      },
    ],
    [
      {
        key: "delete",
        icon: Delete02Icon,
        label: t("settings.catalog.row.delete"),
        run: p.onDelete,
        danger: true,
      },
    ],
  ]
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length)
}

/** Telefonda menü bir eylem çekmecesi (iOS): başparmak bölgesinde, başlıkta kaydın adı. */
function RowSheet({ item, label, groups }) {
  const [open, setOpen] = useState(false)
  const select = (a) => {
    if (a.now) a.run()
    setOpen(false)
    if (!a.now) afterBackSettles(a.run)
  }
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={label}
        data-state={open ? "open" : "closed"}
        onClick={() => setOpen(true)}
        className={TRIGGER}
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={2} />
      </button>
      <BottomSheet open={open} onOpenChange={setOpen} title={item.name} closeOnBack>
        <div className="pb-2">
          {groups.map((group, i) => (
            <ul key={group[0].key} className={cn(i > 0 && "mt-1 border-t border-border/60 pt-1")}>
              {group.map((a) => (
                <li key={a.key}>
                  <button
                    type="button"
                    onClick={() => select(a)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-lg px-1 text-start text-[0.9375rem] transition-colors active:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
                      a.danger && "text-destructive",
                    )}
                  >
                    <HugeiconsIcon
                      icon={a.icon}
                      className={cn("size-5", a.danger ? "text-destructive" : "text-foreground/60")}
                      strokeWidth={1.7}
                    />
                    {a.label}
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}

/**
 * Satırın ⋯ menüsü: ikincil işler burada (aşamalı açılma) — dene, sıra, gizle/göster, kimlik
 * kopyalama, silme. Kimlikler yalnız doluysa; yukarı/aşağı ucu olmayan satırda yok. Masaüstünde
 * açılır menü, telefonda alttan eylem çekmecesi.
 */
export function RowMenu({ phone = false, ...props }) {
  const { t } = useLocale()
  const groups = rowActions(props, t)
  const label = t("settings.catalog.row.more").replace("{name}", props.item.name)
  if (phone) return <RowSheet item={props.item} label={label} groups={groups} />
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger aria-label={label} className={TRIGGER}>
        <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        {groups.map((group, i) => [
          i > 0 && <DropdownMenuSeparator key={`sep-${group[0].key}`} />,
          ...group.map((a) => (
            <DropdownMenuItem
              key={a.key}
              className={ITEM}
              variant={a.danger ? "destructive" : undefined}
              onSelect={a.run}
            >
              <HugeiconsIcon icon={a.icon} className={a.danger ? "size-4" : ICON} />
              {a.label}
              {a.shortcut && (
                <DropdownMenuShortcut className="pointer-coarse:hidden">
                  {a.shortcut}
                </DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          )),
        ])}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

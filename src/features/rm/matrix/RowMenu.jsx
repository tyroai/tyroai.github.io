import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Exchange01Icon from "@hugeicons/core-free-icons/Exchange01Icon"
import MoreVerticalIcon from "@hugeicons/core-free-icons/MoreVerticalIcon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import UserRemove01Icon from "@hugeicons/core-free-icons/UserRemove01Icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRmText } from "../data/useRmText"
import { useRm } from "../shell/RmContext"

/**
 * Matris satırının işlevleri (şartname v5.8 "⋮ İşlevler"): kişi+proje satırında zamanlama,
 * taşıma, çıkarma; proje satırında Kişi ata, tarih, düzenle; kişi satırında projeye ata.
 */
export function RowMenu({ pid = null, rid = null, label }) {
  const { rt } = useRmText()
  const { openEditor } = useRm()
  const items =
    pid && rid
      ? [
          [Clock01Icon, "rm.mx.sched", { kind: "sched", pid, rid }],
          [Exchange01Icon, "rm.mx.move", { kind: "move", pid, rid }],
          null,
          [UserRemove01Icon, "rm.mx.remove", { kind: "remove", pid, rid }, true],
        ]
      : pid
        ? [
            [UserGroupIcon, "rm.assign.title", { kind: "assign", pid }],
            [Calendar03Icon, "rm.dates.title", { kind: "dates", pid }],
            [PencilEdit02Icon, "rm.pform.editTitle", { kind: "project", pid }],
          ]
        : [[UserAdd01Icon, "rm.mx.addTo", { kind: "sched", pid: null, rid }]]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={rt("rm.mx.menuOf", { name: label })}
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-foreground/[0.06] pointer-coarse:size-11"
      >
        <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel className="max-w-64 truncate">{label}</DropdownMenuLabel>
        {items.map((x, i) =>
          x ? (
            <DropdownMenuItem
              key={x[1]}
              variant={x[3] ? "destructive" : "default"}
              onSelect={() => openEditor(x[2])}
              className="gap-2 text-[0.8125rem] pointer-coarse:min-h-11"
            >
              <HugeiconsIcon icon={x[0]} className="size-4" strokeWidth={1.8} />
              {rt(x[1])}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuSeparator key={`sep-${i}`} />
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

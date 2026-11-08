import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { CHIP } from "./chipStyle"

/**
 * "+N": satıra sığmayan klasörler. Masaüstünde açılır menü, telefonda alttan çekmece; ikisi aynı
 * satırı çizer (ad · kök · sayı). Gizli klasörlerden biri açılıyorsa çipte dönen simge.
 */
export function MoreFolders({ folders, onPick, pending, label, title, chipProps }) {
  const { locale } = useLocale()
  const num = getNumberFormat(locale)
  const mobile = useIsMobile()
  const [sheet, setSheet] = useState(false)
  const trigger = (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-busy={pending || undefined}
      onClick={mobile ? () => setSheet(true) : undefined}
      className={cn(CHIP, "shrink-0 tabular-nums", pending && "cursor-progress opacity-60")}
    >
      {pending && (
        <HugeiconsIcon
          icon={Loading03Icon}
          className="size-3.5 animate-spin text-muted-foreground motion-reduce:animate-none"
          strokeWidth={1.9}
        />
      )}
      +{num.format(folders.length)}
    </button>
  )
  const row = (f) => {
    const { name, root } = chipProps(f)
    return (
      <>
        <HugeiconsIcon
          icon={Folder01Icon}
          className="size-4 shrink-0 text-muted-foreground"
          strokeWidth={1.9}
        />
        <span className="min-w-0 flex-1 truncate text-start">
          {name}
          {root && <span className="text-muted-foreground"> · {root}</span>}
        </span>
        <span className="tabular-nums text-muted-foreground">{num.format(f.count)}</span>
      </>
    )
  }

  if (mobile) {
    return (
      <>
        {trigger}
        <BottomSheet open={sheet} onOpenChange={setSheet} title={title}>
          <ul className="space-y-1">
            {folders.map((f) => (
              <li key={f.url}>
                <button
                  type="button"
                  aria-label={chipProps(f).aria}
                  onClick={() => {
                    setSheet(false)
                    onPick(f)
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-[0.875rem] transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {row(f)}
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      </>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-72 p-1.5">
        {folders.map((f) => (
          <DropdownMenuItem
            key={f.url}
            aria-label={chipProps(f).aria}
            onSelect={() => onPick(f)}
            className="gap-2.5 py-2 text-[0.8125rem] pointer-coarse:min-h-11"
          >
            {row(f)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

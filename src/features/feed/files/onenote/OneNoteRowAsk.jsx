import { HugeiconsIcon } from "@hugeicons/react"
import AiScanIcon from "@hugeicons/core-free-icons/AiScanIcon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import Robot01Icon from "@hugeicons/core-free-icons/Robot01Icon"
import { ASK_ITEMS } from "@/components/onenote/askItems"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { stopEscape } from "../menuEscape"

// Dosya satırının TYRO tetiğiyle aynı ölçü (FileRow › FileAssistMenu): dokunmatikte 40 + 8 px pay.
const TRIGGER = cn(
  "size-7 shrink-0 rounded-lg text-brand [&_svg]:!size-4",
  "size-8 text-muted-foreground/70 group-hover/row:text-brand group-focus-within/row:text-brand [@media(pointer:coarse)]:size-10 relative pointer-coarse:after:absolute pointer-coarse:after:-inset-1",
)

/**
 * OneNote satırının TYRO menüsü — okuyucununkiyle aynı üç iş (Özetle · Yapılacakları çıkar ·
 * Hazırlan); başlık dosya menüsünün (`FileAssistMenu`) dilinde, hangi notun gittiğini teyit eder.
 * Sayfa okunurken tetik döner.
 */
export function OneNoteRowAsk({ page, title, busy, onAsk }) {
  const { t } = useLocale()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={busy}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={busy ? t("onenote.find.reading") : t("onenote.find.ask", { title })}
          aria-busy={busy || undefined}
          title={t("onenote.ask.tip")}
          className={TRIGGER}
        >
          <HugeiconsIcon
            icon={busy ? Loading03Icon : AiScanIcon}
            className={busy ? "animate-spin motion-reduce:animate-none" : undefined}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[17rem] p-1.5" onEscapeKeyDown={stopEscape}>
        <div className="mb-1 flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-from/15 via-brand-via/10 to-transparent px-2 py-1.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp shadow-sm">
            <HugeiconsIcon icon={Robot01Icon} className="size-4" strokeWidth={1.9} />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.71875rem] font-semibold leading-tight">
              {t("files.assistHeader")}
            </span>
            <span
              dir="auto"
              className="block truncate text-[0.625rem] leading-tight text-muted-foreground"
            >
              {title}
            </span>
          </span>
        </div>
        {ASK_ITEMS.map(({ mode, icon }) => (
          <DropdownMenuItem
            key={mode}
            onSelect={() => onAsk(page, mode)}
            className="pointer-coarse:min-h-11"
          >
            <HugeiconsIcon icon={icon} strokeWidth={1.8} aria-hidden="true" />
            {t(`onenote.ask.${mode}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

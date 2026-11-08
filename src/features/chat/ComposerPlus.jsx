import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import AtIcon from "@hugeicons/core-free-icons/AtIcon"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Idea01Icon from "@hugeicons/core-free-icons/Idea01Icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * Bestecinin "+" düğmesi (ChatGPT'deki gibi): dosya ekle · referans ekle · Öneri Laboratuvarı
 * tek menüde. Dosya seçici dokunuşun içinde açılır (Safari başka türlü engeller); referans ve
 * laboratuvar menü kapandıktan SONRA açılır — yoksa menünün odağı geri verişi onların odağını
 * çalardı. Referans seçici ya da laboratuvar açıkken düğme marka tonunda.
 */
export function ComposerPlus({ onAttach, onRefToggle, refDisabled, onOpenPromptLab, active }) {
  const { t } = useLocale()
  const after = useRef(null)
  const item = "gap-2.5 py-2 pointer-coarse:min-h-11"
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-tour="chat-plus"
              aria-label={t("chat.plus")}
              className={cn(
                // Eksi baş payı = düğmenin iç boşluğu: alt satırın sol boşluğu yazı alanınınkiyle aynı
                // (`ComposerToolbar`), "+"nın sol ucu (yuvarlak çizgi başı dahil) yazının ilk harfinin
                // sol kenarına gelir — her genişlikte (ürün sahibi; T'nin kenar boşluğuyla ölçüldü).
                "-ms-[1.04rem] size-9 rounded-full text-muted-foreground transition-colors hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground @max-3xl/chat:-ms-[0.91rem] @max-3xl/chat:size-8",
                active && "bg-brand-via/15 text-brand-ink hover:text-brand-ink",
              )}
            >
              <HugeiconsIcon icon={Add01Icon} className="size-5" strokeWidth={1.8} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {t("chat.plus")}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-60 rounded-xl p-1.5"
        onCloseAutoFocus={(e) => {
          const run = after.current
          if (!run) return
          after.current = null
          e.preventDefault()
          run()
        }}
      >
        <DropdownMenuItem className={item} onSelect={onAttach}>
          <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} />
          {t("chat.attach")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={item}
          disabled={refDisabled}
          onSelect={() => (after.current = onRefToggle)}
        >
          <HugeiconsIcon icon={AtIcon} strokeWidth={1.8} />
          {t("ref.button")}
        </DropdownMenuItem>
        {onOpenPromptLab && (
          <DropdownMenuItem className={item} onSelect={() => (after.current = onOpenPromptLab)}>
            <HugeiconsIcon icon={Idea01Icon} strokeWidth={1.8} />
            {t("prompts.labTitle")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

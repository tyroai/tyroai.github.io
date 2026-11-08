import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import { actionButtonClass } from "@/components/common/actionButtonClass"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { askQuestion } from "@/lib/onenote/onenoteAsk"
import { ASK_ITEMS } from "./askItems"

/**
 * Okuyucunun "TYRO" menüsü: Özetle · Yapılacakları çıkar · Hazırlan. Seçim sorusu tyroOffice'e
 * park edilir ve sohbet açılır; okuyucu kapanır (rıhtım bölmenin arkasında kalmasın). İçerik
 * inmeden menü kapalı: boş metinle soru gitmesin.
 */
export function OneNoteAsk({
  page,
  crumb,
  title,
  html,
  onDone,
  size = "page",
  align = "end",
  className,
}) {
  const { t } = useLocale()
  const ask = (mode) => {
    setPendingAsk({
      question: askQuestion(mode, { title, crumb, webUrl: page.webUrl }, html, t),
      agent: "tyroOffice",
    })
    onDone?.()
    requestOpenChat()
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={!html}
        title={t("onenote.ask.tip")}
        className={actionButtonClass({ tone: "soft", size, className })}
      >
        <HugeiconsIcon icon={AiChat02Icon} strokeWidth={2} aria-hidden="true" />
        {t("onenote.ask.label")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-52">
        {ASK_ITEMS.map(({ mode, icon }) => (
          <DropdownMenuItem
            key={mode}
            onSelect={() => ask(mode)}
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

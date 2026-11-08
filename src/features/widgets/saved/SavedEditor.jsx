import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { useLocale } from "@/hooks/useLocale"
import { MAX_SAVED } from "@/features/widgets/lib/savedSearch"
import { FrameAction } from "../WidgetFrame"
import { SavedPinForm } from "./SavedPinForm"

/**
 * Kayıtlı aramaları yönet: her aramayı Bul'da aç ya da kaldır; yer varsa yenisini iğnele.
 * Bul bağlantısı yalnız Keşfet'e erişimi olana (`onOpen` yoksa çizilmez).
 */
export function SavedEditor({ saved, onPin, onRemove, onOpen }) {
  const { t } = useLocale()
  return (
    <div className="space-y-3 p-3 pt-2">
      {saved.length > 0 && (
        <ul className="space-y-1">
          {saved.map((s) => (
            <li key={s.id} className="flex min-h-11 items-center gap-2.5 rounded-xl px-1">
              <HugeiconsIcon
                icon={Search01Icon}
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.8}
              />
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium">{s.q}</span>
              {onOpen && (
                <FrameAction onClick={() => onOpen(s.q)}>
                  {t("widgets.saved.openFiles")}
                </FrameAction>
              )}
              <FrameAction
                onClick={() => onRemove(s.id)}
                aria-label={t("widgets.saved.remove", { q: s.q })}
                title={t("widgets.saved.remove", { q: s.q })}
                className="px-1.5"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
              </FrameAction>
            </li>
          ))}
        </ul>
      )}
      {saved.length < MAX_SAVED ? (
        <SavedPinForm saved={saved} onPin={onPin} />
      ) : (
        <p className="px-1 text-[0.75rem] text-muted-foreground">{t("widgets.saved.full")}</p>
      )}
    </div>
  )
}

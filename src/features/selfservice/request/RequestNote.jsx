import { HugeiconsIcon } from "@hugeicons/react"
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon"
import NoteEditIcon from "@hugeicons/core-free-icons/NoteEditIcon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { countText } from "../kinds"

const TIME = { hour: "2-digit", minute: "2-digit" }
const DAY = { day: "numeric", month: "short" }
const sameDay = (a, b) => a.toDateString() === b.toDateString()

/** "bugün 10:42" · "dün 18:05" · "14 Eki 10:42". */
function whenText(t, locale, at, now = new Date()) {
  const time = getDateTimeFormat(locale, TIME).format(at)
  if (sameDay(at, now)) return t("selfService.draft.today", { time })
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  if (sameDay(at, y)) return t("selfService.draft.yesterday", { time })
  return `${getDateTimeFormat(locale, DAY).format(at)} ${time}`
}

/**
 * Formun başındaki sakin not: taslaktan devam ("Taslağından devam ediyorsun · bugün 10:42",
 * "Yeni başla" boş forma döner) ya da sohbetteki karttan dönüş ("Gönderdiğin talebi
 * düzenliyorsun"); sayfa yenilendiği için gelmeyen fişler varsa söylenir (fişler diske
 * yazılmaz). Anlat'tan açılan formda yazılan cümle ("Anlattığından dolduruldu · “3-5 Kasım yıllık
 * izin”"). `origin`: `{ type: "draft" | "edit" | "narrate", at?, missing?, text? }`.
 */
export function RequestNote({ origin, onRestart }) {
  const { t, locale } = useLocale()
  if (!origin) return null
  const draft = origin.type === "draft"
  if (origin.type === "narrate") {
    return (
      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-brand/[0.06] px-4 py-3 text-[0.8125rem] leading-snug shorter:mb-4">
        <HugeiconsIcon
          icon={MagicWand01Icon}
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-brand-ink"
          strokeWidth={1.9}
        />
        <p className="min-w-0 flex-1">
          <span className="font-semibold">{t("selfService.narrate.noteTitle")}</span>
          <span className="text-foreground/70">
            {" · "}
            {t("selfService.narrate.quote", { text: origin.text })}
          </span>
        </p>
      </div>
    )
  }
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl bg-brand/[0.06] px-4 py-3 text-[0.8125rem] leading-snug shorter:mb-4">
      <HugeiconsIcon
        icon={draft ? NoteEditIcon : PencilEdit02Icon}
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-brand-ink"
        strokeWidth={1.9}
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {t(draft ? "selfService.draft.resumed" : "selfService.draft.editing")}
          {draft && origin.at && (
            <span className="font-normal text-foreground/70">
              {" · "}
              {whenText(t, locale, origin.at)}
            </span>
          )}
        </p>
        {!draft && <p className="mt-0.5 text-foreground/70">{t("selfService.draft.editHint")}</p>}
        {origin.missing > 0 && (
          <p className="mt-0.5 text-foreground/70">
            {countText(t, locale, "selfService.draft.missing", origin.missing)}
          </p>
        )}
      </div>
      {draft && onRestart && (
        <button
          type="button"
          onClick={onRestart}
          className="relative shrink-0 rounded text-[0.8125rem] font-semibold text-brand-ink transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3"
        >
          {t("selfService.draft.restart")}
        </button>
      )}
    </div>
  )
}

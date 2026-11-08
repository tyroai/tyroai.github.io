import { ErrorCause } from "@/components/common/ErrorCause"
import { useLocale } from "@/hooks/useLocale"
import { causeText, withCause } from "@/lib/causeText"

/**
 * Kartın alt notu — yalnız söyleyecek bir şey varken: okunamayan liste (eksik görünen liste "bugün
 * başka işin yok" demiş olurdu) ve yerel yedekteyken kaynak + "To Do'ya bağlan". To Do'ya bağlı ve
 * tam okunmuş listede not yok; To-Do sayfasının yolu başlıktaki ok.
 */
export function TasksNote({ focus, todo, blocked }) {
  const { t } = useLocale()
  const partial = !blocked && focus.skipped > 0
  if (todo && !partial) return null
  return (
    <div className="tasks-note" data-alone={blocked || undefined}>
      {partial && (
        <p
          className="tasks-note-warn"
          title={withCause("", causeText(t, focus.detail)) || undefined}
        >
          {t("myspace.todo.partial", { n: focus.skipped })}
        </p>
      )}
      {!todo && (
        <>
          <div className="tasks-note-row">
            <p>{t("myspace.tasks.local")}</p>
            {focus.canConnect && (
              <button type="button" onClick={focus.connect} className="tasks-note-link">
                {t("myspace.todo.connect")}
              </button>
            )}
          </div>
          {focus.canConnect && <ErrorCause detail={focus.connectDetail} className="mt-1" />}
        </>
      )}
    </div>
  )
}

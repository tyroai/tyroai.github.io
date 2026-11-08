import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { FOCUS_CHOICES, setFocusMode, useFocusMode } from "@/lib/focusMode"
import { applyLink } from "./focusLinkActions"
import { setFocusLink, useFocusLinks } from "./focusLinkStore"
import { ensureScopes } from "./graphTools"

const LABEL = {
  30: "control.focus.choice30",
  60: "control.focus.choice60",
  120: "control.focus.choice120",
  day: "control.focus.choiceDay",
}

/**
 * Odak modunun süresi (Apple'ın gruplu listesi): seçince o süreyle açılır — açıksa yeni süreyle
 * yeniden başlar. Son seçilenin yanında ✓; açıkken ayrı grupta kapat. Altında bağlar: "Takvimde de
 * ayır" ve "Teams'te Rahatsız etmeyin" (açarken izin gerekiyorsa o an istenir; Odak açıksa hemen
 * uygulanır — `FocusLinks`). En altta ne susturulduğu.
 */
export function FocusOptions() {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const { until, choice } = useFocusMode()
  const links = useFocusLinks()
  const on = until != null
  const toggle = async (name, next) => {
    if (next && !(await ensureScopes(instance, accounts[0], name))) return
    setFocusLink(name, next)
    if (on) applyLink(instance, accounts[0], name, next, until, t("control.focus.blockSubject"))
  }
  return (
    <>
      <div className="cc-list" role="group" aria-label={t("control.focus.title")}>
        {FOCUS_CHOICES.map((c) => (
          <button
            key={c}
            type="button"
            className="cc-row"
            aria-pressed={on && choice === c}
            onClick={() => setFocusMode(c)}
          >
            <span className="cc-row-label">{t(LABEL[c])}</span>
            {on && choice === c && (
              <HugeiconsIcon
                icon={Tick02Icon}
                strokeWidth={2}
                aria-hidden="true"
                className="text-brand"
              />
            )}
          </button>
        ))}
      </div>
      {on && (
        <div className="cc-list">
          <button
            type="button"
            className="cc-row"
            data-tone="action"
            onClick={() => setFocusMode(null)}
          >
            <span className="cc-row-label">{t("control.focus.off")}</span>
          </button>
        </div>
      )}
      <div className="cc-list" role="group" aria-label={t("control.focus.linksLabel")}>
        {[
          ["calendar", "control.focus.calendar"],
          ["teams", "control.focus.teams"],
        ].map(([name, key]) => (
          <label key={name} className="cc-row cc-switch">
            <span className="cc-row-label">{t(key)}</span>
            <input
              type="checkbox"
              role="switch"
              checked={links[name]}
              onChange={(e) => toggle(name, e.target.checked)}
            />
          </label>
        ))}
      </div>
      <p className="cc-note">{t("control.focus.about")}</p>
    </>
  )
}

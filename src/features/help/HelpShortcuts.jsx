import { Fragment } from "react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { OFFSCREEN_STYLE, SHORTCUTS_ID } from "./helpContent"

const KBD =
  "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-black/[0.1] bg-background px-1.5 font-sans text-xs font-medium leading-none text-foreground/80 shadow-[0_1px_0_rgb(0_0_0/0.06)] dark:border-white/[0.12]"
const isMac = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")

/**
 * Uygulamada GERÇEKTEN var olan kısayollar (kaynakları: DashboardLayout mod+k, sayfa
 * aramaları `/`, ChatDock Esc, ChatComposer Enter, FeedPostDialog j/k, Self Servis
 * `useFormKeys`). Yenisi eklenirse buraya da. `combos`: alternatif tuş dizileri.
 */
function groups(mod) {
  return [
    [
      "general",
      [
        [[[mod, "K"]], "palette"],
        [[["/"]], "pageSearch"],
        [[["Esc"]], "escape"],
      ],
    ],
    [
      "chat",
      [
        [[["Enter"]], "send"],
        [[["Shift", "Enter"]], "newline"],
      ],
    ],
    ["feed", [[[["J"], ["K"]], "nextPrev"]]],
    [
      "form",
      [
        [[["?"]], "formHelp"],
        [[[mod, "Enter"]], "send"],
      ],
    ],
  ]
}

/** Klavye kısayolları — yalnız ince işaretçide (telefonda klavye kısayolu anlamsız). */
export function HelpShortcuts({ wide = false }) {
  const { t, locale } = useLocale()
  return (
    <section
      id={SHORTCUTS_ID}
      aria-labelledby={`${SHORTCUTS_ID}-title`}
      className="hidden scroll-mt-28 space-y-3 pointer-fine:block"
      style={OFFSCREEN_STYLE}
    >
      {/* tabIndex -1: "Arama ve komut paleti" işlevinin çapası odağı buraya taşır (klavyeyle gelen yerini kaybetmesin). */}
      <h2
        id={`${SHORTCUTS_ID}-title`}
        tabIndex={-1}
        className="text-base font-semibold tracking-tight outline-none"
      >
        {t("help.shortcuts.title")}
      </h2>
      <div
        className={cn(
          "grid gap-x-10 gap-y-5",
          wide ? "@[40rem]/helpc:grid-cols-2" : "@2xl/help:grid-cols-2",
        )}
      >
        {groups(isMac() ? "⌘" : "Ctrl").map(([group, rows]) => (
          <div key={group} className="space-y-1.5">
            <h3
              lang={locale}
              className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
            >
              {t(`help.shortcuts.group.${group}`)}
            </h3>
            <dl className="divide-y divide-border/60">
              {rows.map(([combos, label]) => (
                <div
                  key={label}
                  className="flex min-h-10 items-center justify-between gap-4 py-1.5"
                >
                  <dt className="text-[0.8125rem] text-foreground/85">
                    {t(`help.shortcuts.${label}`)}
                  </dt>
                  <dd className="flex shrink-0 items-center gap-1.5" dir="ltr">
                    {combos.map((keys, i) => (
                      <Fragment key={keys.join("+")}>
                        {i > 0 ? (
                          <span aria-hidden="true" className="text-xs text-muted-foreground">
                            ·
                          </span>
                        ) : null}
                        <kbd className="inline-flex items-center gap-1">
                          {keys.map((key) => (
                            <kbd key={key} className={KBD}>
                              {key}
                            </kbd>
                          ))}
                        </kbd>
                      </Fragment>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}

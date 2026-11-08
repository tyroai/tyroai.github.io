import { HugeiconsIcon } from "@hugeicons/react"
import KeyboardIcon from "@hugeicons/core-free-icons/KeyboardIcon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"

const KBD =
  "inline-flex h-5 min-w-5 items-center justify-center rounded-[0.3125rem] border border-black/[0.1] bg-background px-1 font-sans text-[0.75rem] font-medium leading-none text-foreground/75 shadow-[0_1px_0_rgb(0_0_0/0.06)] dark:border-white/[0.12]"
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")

/** Formun türüne göre kısayol grupları: `[başlık anahtarı, [[tuşlar, etiket], …]]`. */
function groups(t, kind, review) {
  const m = isMac()
  const mod = m ? "⌘" : "Ctrl"
  const out = [
    [
      "selfService.keys.group.form",
      [
        [["?"], t("selfService.keys.help")],
        [
          [mod, "Enter"],
          t(review ? "selfService.expense.grid.keyReview" : "selfService.keys.send"),
        ],
        [["Tab"], t("selfService.keys.next")],
        [["Esc"], t("selfService.keys.close")],
      ],
    ],
  ]
  if (kind === "leave")
    out.push([
      "selfService.keys.group.calendar",
      [
        [["←", "→"], t("selfService.keys.day")],
        [["↑", "↓"], t("selfService.keys.week")],
        [["PgUp", "PgDn"], t("selfService.keys.month")],
        [["Enter"], t("selfService.keys.pick")],
      ],
    ])
  if (kind === "expense")
    out.push(
      [
        "selfService.keys.group.lines",
        [
          [["Enter"], t("selfService.expense.grid.keyDown")],
          [[m ? "⌥" : "Alt", "N"], t("selfService.expense.grid.keyAdd")],
          [[mod, "D"], t("selfService.expense.grid.keyCopy")],
          [[mod, "Z"], t("selfService.keys.undo")],
          [[mod, "V"], t("selfService.keys.paste")],
        ],
      ],
      [
        "selfService.keys.group.preview",
        [
          [["←", "→"], t("selfService.keys.switch")],
          [["R"], t("selfService.keys.rotate")],
          [["+", "−"], t("selfService.keys.zoom")],
        ],
      ],
    )
  return out
}

/**
 * Formun klavye kısayolları: başlıktaki klavye düğmesi (yalnız fareli ekranda) ya da formda "?"
 * açar. Liste formun türüne göre (genel · takvim · kalemler · fiş önizleme), Mac'te ⌘/⌥.
 * `open` ve `onOpenChange` dışarıda: "?" tuşu formun kendisinde dinlenir (`useFormKeys`). Tuş
 * sütunu sabit en: gruplar arasında etiketler hizalı.
 */
export function ShortcutHelp({ kind, review = false, open, onOpenChange }) {
  const { t } = useLocale()
  const title = t("selfService.keys.title")
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title}
          title={`${title} (?)`}
          className="me-1 hidden size-8 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-foreground/70 transition hover:bg-foreground/[0.1] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-fine:grid"
        >
          <HugeiconsIcon
            icon={KeyboardIcon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        aria-label={title}
        className="w-[min(22rem,calc(100vw-2rem))] gap-0 rounded-2xl p-4"
      >
        <p className="text-[0.875rem] font-semibold">{title}</p>
        <div className="mt-3 space-y-3.5">
          {groups(t, kind, review).map(([key, items]) => (
            <section key={key}>
              <h3 className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {t(key)}
              </h3>
              <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-[0.8125rem]">
                {items.map(([keys, label]) => (
                  <div key={label} className="contents">
                    <dt className="flex items-center gap-0.5">
                      {keys.map((k) => (
                        <kbd key={k} className={KBD}>
                          {k}
                        </kbd>
                      ))}
                    </dt>
                    <dd className="min-w-0 text-foreground/85">{label}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

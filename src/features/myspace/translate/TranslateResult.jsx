import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import Tick01Icon from "@hugeicons/core-free-icons/Tick01Icon"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { notify } from "@/lib/notify"
import { TRANSLATE_TARGETS, languageName } from "@/lib/onDeviceTranslate"
import { cn } from "@/lib/utils"

const PCT = { style: "percent", maximumFractionDigits: 0 }
const SMALL_BUTTON =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[0.75rem] font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * "Çevir" açılır kutusunun içi: kaynak → hedef dil (hedef seçilebilir; değişince yeniden çevrilir),
 * çeviri ve kopyala. Dil anlaşılamazsa ya da çift cihazda yoksa sohbette çevirme önerilir.
 */
export function TranslateResult({ text, tr, onPark }) {
  const { t, locale } = useLocale()
  const [copied, setCopied] = useState(false)
  const { state } = tr
  const name = (code) => languageName(code, locale)

  async function copy() {
    try {
      await navigator.clipboard.writeText(state.text)
      setCopied(true)
      notify.success(t("chat.message.copied"))
      setTimeout(() => setCopied(false), 1600)
    } catch {
      notify.error(t("chat.message.copyFailed"))
    }
  }

  if (state.status === "unknown" || state.status === "unsupported" || state.status === "error") {
    const message =
      state.status === "unknown"
        ? t("myspace.translate.unknown")
        : state.status === "unsupported"
          ? t("myspace.translate.unsupported", { from: name(state.source), to: name(state.target) })
          : t("myspace.translate.error")
    const question = state.target
      ? t("myspace.translate.promptTo", { lang: name(state.target), text })
      : t("myspace.translate.prompt", { text })
    return (
      <>
        <p role="status" className="text-muted-foreground">
          {message}
        </p>
        <button
          type="button"
          onClick={() => onPark(question)}
          className={cn(SMALL_BUTTON, "self-start")}
        >
          {t("myspace.translate.inChat")}
        </button>
      </>
    )
  }

  const working = state.status !== "done"
  return (
    <>
      {state.source && (
        <div className="flex min-w-0 items-center gap-1.5 text-[0.75rem] text-muted-foreground">
          <span className="truncate">{name(state.source)}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            aria-hidden="true"
            className="size-3.5 shrink-0"
            strokeWidth={2}
          />
          <select
            aria-label={t("myspace.translate.target")}
            value={state.target}
            onChange={(e) => tr.run(text, { source: state.source, target: e.target.value })}
            className="h-7 min-w-0 rounded-md border border-border bg-background px-1.5 text-[0.75rem] text-foreground"
          >
            {TRANSLATE_TARGETS.filter((code) => code !== state.source).map((code) => (
              <option key={code} value={code}>
                {name(code)}
              </option>
            ))}
          </select>
        </div>
      )}
      {working ? (
        <p role="status" className="flex items-center gap-2 text-muted-foreground">
          <HugeiconsIcon
            icon={Loading03Icon}
            aria-hidden="true"
            className="size-4 animate-spin"
            strokeWidth={2}
          />
          {state.progress != null
            ? t("myspace.translate.downloading", {
                p: getNumberFormat(locale, PCT).format(state.progress),
              })
            : t("myspace.translate.working")}
        </p>
      ) : (
        <>
          <p
            lang={state.target}
            dir="auto"
            className="max-h-[min(50vh,18rem)] overflow-y-auto whitespace-pre-wrap text-[0.875rem] leading-6 text-foreground"
          >
            {state.text}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.6875rem] text-muted-foreground">
              {t("myspace.translate.local")}
            </span>
            <button type="button" onClick={copy} className={SMALL_BUTTON}>
              <HugeiconsIcon
                icon={copied ? Tick01Icon : Copy01Icon}
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.9}
              />
              {t("myspace.translate.copy")}
            </button>
          </div>
        </>
      )}
    </>
  )
}

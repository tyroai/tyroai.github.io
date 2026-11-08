import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon"
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { useNarrateDictation } from "./useNarrateDictation"

const ROUND =
  "relative grid size-8 shrink-0 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2"

/**
 * Anlat'ın yazı kutusu: sihirbaz simgesi, örnekli yer tutucu, Enter `onSubmit`, yazı varken ×,
 * mikrofon (sesle yazdırma, `useNarrateDictation`; tarayıcı desteklemiyorsa yok) ve `canSubmit`
 * iken onay düğmesi (`submitLabel`) — konuşarak yazan kişinin klavyesi açık olmayabilir.
 * `onKeyDown`: çağıranın ek tuşları (menüde aşağı ok seçeneklere iner); `placeholder`: formun
 * türüne göre örnek (yoksa izin örneği). `examples`: kutu boşken sırayla dönen örnekler (menüde:
 * izin · avans · masraf — kişi üçünün de anlatılabildiğini görsün). `label`: kutunun erişilebilir adı
 * (Takvim'in Anlat'ı da bu kutuyu kullanır; yoksa "Talebini anlat").
 */
export function NarrateField({
  text,
  setText,
  onSubmit,
  onKeyDown,
  inputRef,
  autoFocus,
  placeholder,
  examples = null,
  canSubmit = false,
  submitLabel,
  label,
  className,
}) {
  const { t } = useLocale()
  const [turn, setTurn] = useState(0)
  const dictation = useNarrateDictation({ text, setText })
  const rotating = Boolean(examples?.length) && !text && !dictation.listening
  useEffect(() => {
    if (!rotating) return undefined
    const id = setInterval(() => setTurn((n) => n + 1), 3500)
    return () => clearInterval(id)
  }, [rotating])
  const hint = dictation.listening
    ? t("chat.mic.listeningPlaceholder")
    : rotating
      ? examples[turn % examples.length]
      : placeholder
  const submit = () => {
    dictation.stop()
    onSubmit()
  }
  return (
    <div
      data-tour="narrate"
      className={cn(
        "flex h-11 min-w-0 items-center gap-2 rounded-xl border border-black/[0.1] bg-background pe-1.5 ps-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition focus-within:border-brand/55 focus-within:ring-4 focus-within:ring-brand/12 dark:border-white/[0.12] pointer-coarse:h-12",
        className,
      )}
    >
      <HugeiconsIcon
        icon={MagicWand01Icon}
        aria-hidden="true"
        className="size-[1.125rem] shrink-0 text-brand-ink"
        strokeWidth={1.9}
      />
      <input
        ref={inputRef}
        type="text"
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
            return
          }
          onKeyDown?.(e)
        }}
        placeholder={hint ?? t("selfService.narrate.placeholder")}
        aria-label={label ?? t("selfService.narrate.label")}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="go"
        className="no-ios-zoom h-full min-w-0 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-muted-foreground"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText("")
            inputRef?.current?.focus()
          }}
          aria-label={t("selfService.form.searchClear")}
          className={cn(
            ROUND,
            "size-7 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" className="size-3.5" />
        </button>
      )}
      {dictation.usable && (
        <button
          type="button"
          onClick={dictation.toggle}
          aria-pressed={dictation.listening}
          aria-label={t(dictation.listening ? "chat.mic.stop" : "chat.mic.start")}
          className={cn(
            ROUND,
            dictation.listening
              ? "bg-brand-via/15 text-brand-deep"
              : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          {dictation.listening ? (
            <span aria-hidden="true" className="mic-bars relative z-[1]">
              <span />
              <span />
              <span />
              <span />
            </span>
          ) : (
            <HugeiconsIcon icon={Mic01Icon} aria-hidden="true" className="size-[1.125rem]" />
          )}
          {dictation.listening && <span aria-hidden="true" className="mic-listening-pulse" />}
        </button>
      )}
      {canSubmit && submitLabel && (
        <button
          type="button"
          onClick={submit}
          aria-label={submitLabel}
          title={submitLabel}
          className={cn(ROUND, "bg-brand-fill-deep text-brand-on-brand hover:brightness-110")}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={2.2}
          />
        </button>
      )}
    </div>
  )
}

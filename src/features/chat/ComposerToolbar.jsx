import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon"
import MicOff01Icon from "@hugeicons/core-free-icons/MicOff01Icon"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { AgentSelect } from "./AgentSelect"
import { ComposerPlus } from "./ComposerPlus"

/** Bestecinin alt satırı (ChatGPT düzeni): + (ek · referans · laboratuvar) | asistan · mikrofon · gönder. */
export function ComposerToolbar({
  agent,
  onAgentChange,
  disabled,
  onAttach,
  refOpen,
  onRefToggle,
  onOpenPromptLab,
  promptLabOpen,
  micUsable,
  listening,
  onMic,
  canSend,
  onSend,
  // Alanlı hazır soru açıkken yazı alanı yok: referans ve dikte yazacak yer bulamaz.
  locked = false,
}) {
  const { t } = useLocale()
  return (
    // Sol boşluk yazı alanınınkiyle AYNI (ChatComposer: px-4 sm:px-6 @max-3xl:px-3.5): "+" yazının
    // ilk harfiyle her düzende aynı çizgide; düğme yalnız kendi iç boşluğu kadar sola taşar.
    <div className="flex items-center justify-between gap-2 py-2 pe-3 ps-4 sm:py-2.5 sm:pe-5 sm:ps-6 @max-3xl/chat:py-1.5 @max-3xl/chat:pe-2.5 @max-3xl/chat:ps-3.5">
      <ComposerPlus
        onAttach={onAttach}
        onRefToggle={onRefToggle}
        refDisabled={disabled || locked}
        onOpenPromptLab={onOpenPromptLab}
        active={refOpen || Boolean(promptLabOpen)}
      />
      <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
        {/* Asistan seçimi ChatGPT'nin model seçicisi gibi: mikrofonun solunda, çerçevesiz. */}
        <AgentSelect value={agent} onChange={onAgentChange} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMic}
              disabled={disabled || locked}
              aria-label={
                !micUsable
                  ? t("chat.mic.unsupported")
                  : listening
                    ? t("chat.mic.stop")
                    : t("chat.mic.start")
              }
              aria-pressed={listening}
              data-mic-state={!micUsable ? "unsupported" : listening ? "listening" : "idle"}
              data-tour="chat-mic"
              className={cn(
                "relative size-9 rounded-full text-muted-foreground transition-colors hover:text-foreground @max-3xl/chat:size-8",
                listening && "bg-brand-via/15 text-brand-deep hover:text-brand-deep",
                !micUsable && "opacity-50 cursor-not-allowed hover:text-muted-foreground",
              )}
            >
              {listening ? (
                <span aria-hidden="true" className="mic-bars relative z-[1]">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <HugeiconsIcon
                  icon={micUsable ? Mic01Icon : MicOff01Icon}
                  className="relative z-[1] size-[1.125rem]"
                />
              )}
              {listening && <span aria-hidden="true" className="mic-listening-pulse" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {!micUsable
              ? t("chat.mic.unsupported")
              : listening
                ? t("chat.tooltip.micStop")
                : t("chat.tooltip.mic")}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={onSend}
              disabled={disabled || !canSend}
              aria-label={t("chat.send")}
              className={cn(
                "size-9 rounded-full bg-gradient-to-br from-brand-from via-brand-via to-brand-to p-0 text-brand-on-ramp shadow-sm @max-3xl/chat:size-8",
                "duration-200 ease-linear hover:brightness-110 hover:text-brand-on-ramp",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              <HugeiconsIcon icon={ArrowUp01Icon} className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {t("chat.send")}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

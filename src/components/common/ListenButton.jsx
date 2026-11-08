import { HugeiconsIcon } from "@hugeicons/react"
import StopCircleIcon from "@hugeicons/core-free-icons/StopCircleIcon"
import VolumeHighIcon from "@hugeicons/core-free-icons/VolumeHighIcon"
import { useLocale } from "@/hooks/useLocale"
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis"
import { bcp47 } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"

/**
 * "Dinle": verilen metni sesli okur (basınca; kendiliğinden asla). YALNIZ cihazdaki seslerle
 * (`localOnly`): bulut sesleri metni üreticinin sunucusuna gönderir. Arayüz dili için yerel ses
 * yoksa düğme hiç görünmez. Okurken basmak durdurur. `getText`: o anki metin (görünen özet).
 */
export function ListenButton({ getText, className }) {
  const { t, locale } = useLocale()
  const lang = bcp47(locale)
  const speech = useSpeechSynthesis({ localOnly: true })
  if (!speech.isSupported || !speech.hasVoice(lang)) return null
  const label = speech.isSpeaking ? t("widgets.listen.stop") : t("widgets.listen.start")
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={speech.isSpeaking}
      onClick={() => (speech.isSpeaking ? speech.cancel() : speech.speak(getText(), { lang }))}
      className={cn(
        "relative inline-grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2",
        speech.isSpeaking && "text-brand-ink",
        className,
      )}
    >
      <HugeiconsIcon
        icon={speech.isSpeaking ? StopCircleIcon : VolumeHighIcon}
        aria-hidden="true"
        className="size-4"
        strokeWidth={1.9}
      />
    </button>
  )
}

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import PauseIcon from "@hugeicons/core-free-icons/PauseIcon"
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon"
import Timer02Icon from "@hugeicons/core-free-icons/Timer02Icon"
import Undo02Icon from "@hugeicons/core-free-icons/Undo02Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { useLocale } from "@/hooks/useLocale"
import {
  PRESETS,
  formatClock,
  pauseTimer,
  remainingMs,
  resetTimer,
  resumeTimer,
  setTimerMinutes,
  startTimer,
  useFocusTimer,
} from "@/lib/focusTimer"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { WidgetFrame } from "../WidgetFrame"
import { TimerRing } from "./TimerRing"
import { useNow } from "./useTick"
import "./focusTimer.css"

const ROUND =
  "relative grid size-11 shrink-0 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 [&_svg]:size-5"

/**
 * Odak sayacı — Apple'ın zamanlayıcısı gibi: halkada kalan süre, altında bitiş saati; büyük
 * yuvarlak Başlat/Duraklat, yanında Sıfırla. Süre 15 · 25 · 50 dk (çalışırken gizli). Sayaç
 * sayfadan bağımsız (`lib/focusTimer`): sayfa değişse de sürer, bitince header'daki uyarı haber
 * verir; header'a konunca kalan süre ikonun yanında akar. Dar kartta süreler halkanın altında,
 * genişte sağ sütunda.
 */
export function FocusTimerWidget({ className }) {
  const { t, locale } = useLocale()
  const timer = useFocusTimer()
  const running = Boolean(timer.endsAt)
  const paused = !running && timer.left != null
  const done = !running && !paused && timer.doneAt != null
  const ms = remainingMs(timer, useNow(running))
  const [say, setSay] = useState("")
  const status = running
    ? t("widgets.focusTimer.endsAt", {
        time: getDateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
          new Date(timer.endsAt),
        ),
      })
    : paused
      ? t("widgets.focusTimer.paused")
      : done
        ? t("widgets.focusTimer.done")
        : t("widgets.focusTimer.ready", { m: timer.minutes })

  const primary = running
    ? { label: t("widgets.focusTimer.pause"), icon: PauseIcon, run: pauseTimer, say: "paused" }
    : paused
      ? { label: t("widgets.focusTimer.resume"), icon: PlayIcon, run: resumeTimer, say: "resumed" }
      : {
          label: t(done ? "widgets.focusTimer.again" : "widgets.focusTimer.start"),
          icon: PlayIcon,
          run: () => startTimer(timer.minutes),
          say: "started",
        }

  const presets = !running && !paused && (
    <SegmentedControl
      label={t("widgets.focusTimer.length")}
      value={timer.minutes}
      onChange={setTimerMinutes}
      // Yalnız sayı (dar kartta "15 dk" sığmıyordu); grubun adı "Süre (dakika)", ipucunda "15 dk".
      options={PRESETS.map((m) => ({
        value: m,
        label: String(m),
        title: t("widgets.focusTimer.minutes", { m }),
      }))}
      itemClassName="px-2"
      fill
    />
  )

  return (
    <WidgetFrame
      id="focus-timer"
      title={t("widgets.focusTimer.title")}
      icon={Timer02Icon}
      className={className}
    >
      <div className="ft-row mt-2 flex min-h-0 flex-1 items-center">
        <TimerRing
          progress={done ? 1 : ms / (timer.minutes * 60000)}
          done={done}
          className="ft-ring"
        >
          <span
            role="timer"
            className="ft-time leading-none font-semibold tracking-[-0.02em] tabular-nums"
          >
            {formatClock(done ? 0 : ms)}
          </span>
          <span className="ft-status mt-1 truncate text-muted-foreground">{status}</span>
        </TimerRing>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
          {presets && <div className="ft-presets-side w-full">{presets}</div>}
          {/* Çok dar kartta düğmeler alt alta: halkanın yanına sığsın. */}
          <div className="ft-controls flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                primary.run()
                setSay(t(`widgets.focusTimer.say.${primary.say}`, { m: timer.minutes }))
              }}
              aria-label={primary.label}
              title={primary.label}
              className={cn(
                ROUND,
                "ft-primary bg-brand-fill-deep text-brand-on-brand shadow-sm hover:brightness-110",
              )}
            >
              <HugeiconsIcon icon={primary.icon} strokeWidth={2} aria-hidden="true" />
            </button>
            {(running || paused || done) && (
              <button
                type="button"
                onClick={() => {
                  resetTimer()
                  setSay(t("widgets.focusTimer.say.reset"))
                }}
                aria-label={t("widgets.focusTimer.reset")}
                title={t("widgets.focusTimer.reset")}
                className={cn(
                  ROUND,
                  "bg-muted text-foreground/80 hover:bg-accent hover:text-foreground",
                )}
              >
                <HugeiconsIcon icon={Undo02Icon} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
      {presets && <div className="ft-presets-below mt-3">{presets}</div>}
      <p role="status" aria-live="polite" className="sr-only">
        {say}
      </p>
    </WidgetFrame>
  )
}

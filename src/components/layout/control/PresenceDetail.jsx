import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import {
  PRESENCE_CHOICES,
  PRESENCE_DURATIONS,
  defaultUntil,
  presenceLabelKey,
  presenceTone,
} from "./presenceModel"
import { usePresence } from "./usePresence"

// "Teams'e bırakıldı" onayı bu kadar kalır.
const CONFIRM_MS = 2200

/** Satırın sonundaki işaret: istek sürerken dönen simge, bitince tik. */
function Mark({ busy, done }) {
  if (busy)
    return (
      <HugeiconsIcon
        icon={Loading03Icon}
        strokeWidth={2}
        aria-hidden="true"
        className="animate-spin motion-reduce:animate-none"
      />
    )
  if (!done) return null
  return (
    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" className="text-brand" />
  )
}

const DURATION_KEY = {
  60: "control.presence.d60",
  time: "control.presence.dtime",
  day: "control.presence.dday",
}

/** "Şu an" satırının ikinci satırı: durumu kim koyuyor, ne zamana kadar. */
function sourceText(source, t, locale) {
  const time = (ms) =>
    new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(ms)
  if (source.by === "focus") return t("control.presence.byFocus", { time: time(source.until) })
  if (source.by === "you")
    return source.until
      ? t("control.presence.byYouUntil", { time: time(source.until) })
      : t("control.presence.byYou")
  return source.reason ? t(`control.presence.why.${source.reason}`) : t("control.presence.byTeams")
}

/**
 * Teams durumunu seç (Teams'in kendi menüsü gibi): en üstte "şu an" — durum ve onu kimin koyduğu
 * (Teams mi, sen mi, Odak modu mu); beş durum (tik yalnız senin seçtiğinde), süre (1 saat ·
 * seçilen saate kadar · gün sonu), "Teams'e bırak". "Saat seç" altında bitiş saati açılır; ilk
 * değeri yarım saate yuvarlı (`defaultUntil`), geçmiş bir saat yarına düşer. İzin yoksa önce bir
 * kez "Bağlan". Tercih yalnız Teams açıkken görünür.
 *
 * Basış hissedilir: satır dokunuşta koyulaşır, istek sürerken sonunda dönen simge (satır kilitli,
 * odak yerinde), bitince tik; "Teams'e bırak" kısa bir "Teams'e bırakıldı" onayı gösterir.
 */
export function PresenceDetail() {
  const { t, locale } = useLocale()
  const p = usePresence()
  const [duration, setDuration] = useState(60)
  const [until, setUntil] = useState("")
  const [error, setError] = useState("")
  // Süren istek ("reset" ya da durum) ve "Teams'e bırakıldı" onayı.
  const [pending, setPending] = useState(null)
  const [released, setReleased] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const run = async (key, call) => {
    if (pending) return
    setPending(key)
    setReleased(false)
    const res = await call()
    setPending(null)
    const ok = res.status === STATUS.ready
    setError(ok ? "" : t("control.presence.failed"))
    if (ok && key === "reset") {
      setReleased(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setReleased(false), CONFIRM_MS)
    }
  }

  if (p.status === "consent") {
    return (
      <div className="cc-form">
        <p className="cc-note">{t("control.presence.connectNote")}</p>
        <button type="button" className="cc-pill" data-tone="prominent" onClick={p.connect}>
          {t("control.presence.connect")}
        </button>
      </div>
    )
  }
  const chosen = p.source?.by === "you" ? p.availability : null
  return (
    <>
      {p.source && (
        <div className="cc-now" role="status">
          <span className="cc-dot" data-tone={presenceTone(p.availability)} aria-hidden="true" />
          <span className="cc-now-text">
            <span className="cc-now-state">{t(presenceLabelKey(p.availability, p.activity))}</span>
            <span className="cc-now-by">{sourceText(p.source, t, locale)}</span>
          </span>
        </div>
      )}
      <div className="cc-list" role="group" aria-label={t("control.presence.title")}>
        {PRESENCE_CHOICES.map((c) => (
          <button
            key={c}
            type="button"
            className="cc-row"
            aria-pressed={chosen === c}
            aria-busy={pending === c || undefined}
            aria-disabled={pending ? true : undefined}
            onClick={() => run(c, () => p.choose(c, duration, until))}
          >
            <span className="cc-dot" data-tone={presenceTone(c)} aria-hidden="true" />
            <span className="cc-row-label">{t(`control.presence.${c}`)}</span>
            <Mark busy={pending === c} done={chosen === c} />
          </button>
        ))}
      </div>
      <div className="cc-chips" role="group" aria-label={t("control.presence.for")}>
        {PRESENCE_DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            className="cc-chip"
            aria-pressed={duration === d}
            onClick={() => {
              if (d === "time" && !until) setUntil(defaultUntil(Date.now()))
              setDuration(d)
            }}
          >
            {t(DURATION_KEY[d])}
          </button>
        ))}
      </div>
      {duration === "time" && (
        <label className="cc-until">
          {t("control.presence.until")}
          <input
            type="time"
            step={300}
            required
            className="cc-input"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </label>
      )}
      <div className="cc-list">
        <button
          type="button"
          className="cc-row"
          data-tone="action"
          aria-busy={pending === "reset" || undefined}
          aria-disabled={pending ? true : undefined}
          onClick={() => run("reset", p.reset)}
        >
          <span className="cc-row-label">
            {t(released ? "control.presence.resetDone" : "control.presence.reset")}
          </span>
          <Mark busy={pending === "reset"} done={released} />
        </button>
      </div>
      {error && (
        <p role="alert" className="cc-error">
          {error}
        </p>
      )}
      <p className="cc-note">{t("control.presence.note")}</p>
    </>
  )
}

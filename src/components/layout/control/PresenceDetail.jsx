import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { PRESENCE_CHOICES, PRESENCE_DURATIONS, presenceTone } from "./presenceModel"
import { usePresence } from "./usePresence"

const DURATION_KEY = {
  60: "control.presence.d60",
  120: "control.presence.d120",
  day: "control.presence.dday",
}

/**
 * Teams durumunu seç (Teams'in kendi menüsü gibi): beş durum, süre (1 saat · 2 saat · gün sonu),
 * "Teams'e bırak". İzin yoksa önce bir kez "Bağlan". Tercih yalnız Teams açıkken görünür.
 */
export function PresenceDetail() {
  const { t } = useLocale()
  const p = usePresence()
  const [duration, setDuration] = useState(60)
  const [error, setError] = useState("")
  const done = (res) => setError(res.status === STATUS.ready ? "" : t("control.presence.failed"))

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
  return (
    <>
      <div className="cc-list" role="group" aria-label={t("control.presence.title")}>
        {PRESENCE_CHOICES.map((c) => (
          <button
            key={c}
            type="button"
            className="cc-row"
            aria-pressed={p.availability === c}
            onClick={async () => done(await p.choose(c, duration))}
          >
            <span className="cc-dot" data-tone={presenceTone(c)} aria-hidden="true" />
            <span className="cc-row-label">{t(`control.presence.${c}`)}</span>
            {p.availability === c && (
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
      <div className="cc-chips" role="group" aria-label={t("control.presence.for")}>
        {PRESENCE_DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            className="cc-chip"
            aria-pressed={duration === d}
            onClick={() => setDuration(d)}
          >
            {t(DURATION_KEY[d])}
          </button>
        ))}
      </div>
      <div className="cc-list">
        <button
          type="button"
          className="cc-row"
          data-tone="action"
          onClick={async () => done(await p.reset())}
        >
          <span className="cc-row-label">{t("control.presence.reset")}</span>
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

import { useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { STATUS } from "@/lib/graph"
import { shownRange } from "./oofActions"
import { nextLeave, returnDay } from "./oofModel"
import { oofTexts, rangeText } from "./oofText"
import { useOof } from "./useOof"

const pad = (n) => String(n).padStart(2, "0")
const ymd = (d) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "")
const fromYmd = (s) => {
  const [y, m, d] = (s ?? "").split("-").map(Number)
  return y && m && d ? new Date(y, m - 1, d) : null
}

/**
 * Otomatik yanıtın ayrıntısı: durum, sıradaki onaylı izin (tarihler ondan gelir, değiştirilebilir),
 * kurum içi metin, "kurum dışına da gönder" ve iki dilli dış metin; *Planla* (izin günü açılır,
 * dönüş sabahı kapanır) · *Şimdi aç* · *Kapat*. Metinler tarih değişince yeniden yazılır, kişi
 * düzenlediyse onunki kalır. Metinler kişisel: Sunum modunda rakamları gizli.
 */
export function OofDetail() {
  const { t, locale } = useLocale()
  const oof = useOof()
  const now = useMinuteNow().getTime()
  const suggested =
    oof.ask?.kind === "set" ? oof.ask.leave : oof.spans ? nextLeave(oof.spans, now) : null
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [internal, setInternal] = useState(null)
  const [external, setExternal] = useState(null)
  const [outside, setOutside] = useState(true)
  const [busy, setBusy] = useState(false)
  const [said, setSaid] = useState("")

  const start = fromYmd(from) ?? suggested?.start ?? null
  const end = fromYmd(to) ?? suggested?.end ?? null
  const leave = start && end && end >= start ? { start, end } : null
  const defaults = leave
    ? oofTexts(t, locale, leave, returnDay(leave.end))
    : { internal: t("control.oof.msgPlain"), external: t("control.oof.msgPlain") }
  const texts = {
    internal: internal ?? defaults.internal,
    external: external ?? defaults.external,
    audience: outside ? "all" : "none",
  }
  const kind = oof.state?.kind ?? "off"
  const status =
    kind === "scheduled"
      ? t("control.oof.scheduled", { range: shownRange(locale, oof.state) })
      : kind === "off"
        ? t("control.oof.off")
        : t("control.oof.on")

  const run = async (call, okKey) => {
    setBusy(true)
    const res = await call()
    setBusy(false)
    setSaid(res.status === STATUS.ready ? t(okKey) : t("control.oof.failed"))
  }

  return (
    <form
      className="cc-form cc-oof"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (leave) run(() => oof.schedule(leave, texts), "control.oof.savedScheduled")
      }}
    >
      <p className="cc-oof-status" data-kind={kind}>
        {status}
      </p>
      {oof.ask?.kind === "clear" && (
        <div className="cc-list">
          <p className="cc-note">{t("control.oof.askClear")}</p>
          <button
            type="button"
            className="cc-row"
            data-tone="action"
            disabled={busy}
            onClick={() => run(oof.turnOff, "control.oof.savedOff")}
          >
            <span className="cc-row-label">{t("control.oof.remove")}</span>
          </button>
        </div>
      )}
      {suggested && (
        <p className="cc-note" data-private="">
          {t("control.oof.next", { range: rangeText(locale, suggested.start, suggested.end) })}
        </p>
      )}
      <div className="cc-dates">
        <label className="cc-label-field">
          <span>{t("control.oof.from")}</span>
          <input
            type="date"
            className="cc-input"
            value={from ?? ymd(start)}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="cc-label-field">
          <span>{t("control.oof.to")}</span>
          <input
            type="date"
            className="cc-input"
            value={to ?? ymd(end)}
            min={from ?? ymd(start)}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <label className="cc-label-field">
        <span>{t("control.oof.internal")}</span>
        <textarea
          className="cc-input cc-area"
          rows={4}
          value={texts.internal}
          onChange={(e) => setInternal(e.target.value)}
          data-private=""
        />
      </label>
      <label className="cc-switch">
        <span>{t("control.oof.externalOn")}</span>
        <input
          type="checkbox"
          role="switch"
          checked={outside}
          onChange={(e) => setOutside(e.target.checked)}
        />
      </label>
      {outside && (
        <label className="cc-label-field">
          <span>{t("control.oof.external")}</span>
          <textarea
            className="cc-input cc-area"
            rows={6}
            value={texts.external}
            onChange={(e) => setExternal(e.target.value)}
            data-private=""
          />
        </label>
      )}
      <div className="cc-actions">
        <button type="submit" className="cc-pill" data-tone="prominent" disabled={busy || !leave}>
          {t("control.oof.schedule")}
        </button>
        <button
          type="button"
          className="cc-pill"
          disabled={busy}
          onClick={() => run(() => oof.turnOn(texts), "control.oof.savedOn")}
        >
          {t("control.oof.turnOn")}
        </button>
        {kind !== "off" && (
          <button
            type="button"
            className="cc-pill"
            data-tone="plain"
            disabled={busy}
            onClick={() => run(oof.turnOff, "control.oof.savedOff")}
          >
            {t("control.oof.turnOff")}
          </button>
        )}
      </div>
      <p role="status" className="cc-note">
        {said}
      </p>
      <p className="cc-note">{t("control.oof.note")}</p>
    </form>
  )
}

import "@/lib/i18n/control"
import { useEffect, useId, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import MailReply01Icon from "@hugeicons/core-free-icons/MailReply01Icon"
import { removeOof, setUpOof } from "@/components/layout/control/oofActions"
import { rangeText } from "@/components/layout/control/oofText"
import { useOof } from "@/components/layout/control/useOof"
import { useLocale } from "@/hooks/useLocale"
import "./bellOof.css"

function Mark() {
  return (
    <span className="bell-oof-ic" aria-hidden="true">
      <HugeiconsIcon icon={MailReply01Icon} strokeWidth={1.8} />
    </span>
  )
}

/**
 * ÇANIN BEKLEYEN SORUSU (sekmelerin üstünde, iki sekmede de): onaylı izin için "12–16 Kasım
 * iznin onaylandı · Otomatik yanıt kurulsun mu?" (*Kur* hazır metinle planlar, × "bu izin için
 * sorma") ya da TYRO'nun kurduğu yanıtın izni kalmadıysa "kaldırılsın mı?". Denetim Merkezi'nin
 * şeridiyle aynı soru, aynı görünüş (`OofPrompt`; düğmeler şeridin hapları — ortak `ActionButton`
 * bu tembel parçaya girince derleyici ilk paketi böldü). Veriyi açılınca tazeler (`useOof`);
 * cevaplanınca kalkar ve odak panele geçer. Yanıt asla kendiliğinden kurulmaz.
 */
export default function BellOof() {
  const { t, locale } = useLocale()
  const oof = useOof()
  const { ask } = oof
  const id = useId()
  const box = useRef(null)
  const shown = useRef(false)
  const [busy, setBusy] = useState(false)

  // Cevaplanınca satır kalkar: odak düğmeyle birlikte kaybolmasın, panelde kalsın.
  useEffect(() => {
    if (ask) {
      shown.current = true
      return
    }
    if (!shown.current) return
    shown.current = false
    const panel = box.current?.closest('[role="dialog"]')
    if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true })
  }, [ask])

  const act = (run) => () => {
    setBusy(true)
    run().finally(() => setBusy(false))
  }

  let row = null
  if (!oof.settled) {
    row = (
      <div className="bell-oof" aria-hidden="true">
        <span className="bell-oof-dot ms-skeleton" />
        <span className="bell-oof-text">
          <span className="bell-oof-bar ms-skeleton" />
          <span className="bell-oof-bar ms-skeleton" />
        </span>
      </div>
    )
  } else if (ask?.kind === "clear") {
    row = (
      <div className="bell-oof">
        <Mark />
        <span className="bell-oof-text" id={id}>
          <span className="bell-oof-title">{t("control.oof.mismatch")}</span>
        </span>
        <span className="bell-oof-actions">
          <button
            type="button"
            className="bell-oof-pill"
            aria-describedby={id}
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={act(() => removeOof(oof, t))}
          >
            {t("control.oof.remove")}
          </button>
        </span>
      </div>
    )
  } else if (ask) {
    const { leave } = ask
    row = (
      <div className="bell-oof">
        <Mark />
        <span className="bell-oof-text" id={id}>
          <span className="bell-oof-title" data-private="">
            {t("control.oof.askShort", { range: rangeText(locale, leave.start, leave.end) })}
          </span>
          <span className="bell-oof-sub">{t("control.oof.askSub")}</span>
        </span>
        <span className="bell-oof-actions">
          <button
            type="button"
            className="bell-oof-pill"
            aria-describedby={id}
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={act(() => setUpOof(oof, leave, t, locale))}
          >
            {t("control.oof.setUp")}
          </button>
          <button
            type="button"
            className="bell-oof-x"
            aria-label={t("control.oof.skip")}
            title={t("control.oof.skip")}
            disabled={busy}
            onClick={() => oof.skip(leave)}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
          </button>
        </span>
      </div>
    )
  }
  return (
    <div ref={box} className="bell-oof-slot">
      {row}
    </div>
  )
}

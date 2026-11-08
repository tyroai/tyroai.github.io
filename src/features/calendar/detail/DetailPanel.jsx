import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { useLocale } from "@/hooks/useLocale"
import { DetailBody } from "../EventDetail"
import { LazyRecordPane } from "../LazyRecordSheet"
import { useLeaveDesk } from "../leaveDeskContext"
import { MeetingPanel } from "./MeetingPanel"
import "./detailPanel.css"

// Toplantı kartı olmayan türler: kendi kısa gövdeleri (`DetailBodies`) panelde de aynı.
const OWN_BODY = new Set(["task", "teamLeave", "shared", "celebration", "holiday"])

/** Kendi iznim: Self Servis'in kayıt ayrıntısı (pencerede açılanla aynı içerik ve eylemler). */
function LeavePane({ item }) {
  const desk = useLeaveDesk()
  return (
    <LazyRecordPane
      record={item.source}
      person={desk?.person}
      onAsk={desk?.ask}
      bodyClass="cal-dp-body"
      footClass="cal-dp-foot"
    />
  )
}

/**
 * Geniş kapta etkinliğin ayrıntısı Takvim özetinin YERİNDE açılır (bloğa bağlı mini kart yok):
 * başlıkta türün adı ve kapat (×) — kapatınca özet geri gelir, odak açan bloğa döner. Escape de
 * kapatır. Başka bloğa basınca içerik değişir. Dar kapta ve telefonda eski yüzey (popover,
 * çekmece) sürer: orada özet ızgaranın altında, ayrıntı gözden kaçardı.
 */
export function DetailPanel({ item, access, board, onClose }) {
  const { t } = useLocale()
  const title = useRef(null)
  // Açılınca (ve başka öğeye geçince) odak başlığa: klavyeyle gelen panelin başından okur.
  useEffect(() => {
    title.current?.focus({ preventScroll: true })
  }, [item.id])
  return (
    <aside
      className="cal-stats cal-dp"
      aria-labelledby="cal-dp-title"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return
        // Sohbet rıhtımı pencerede Escape dinliyor: paneli kapatan Escape rıhtımı kapatmasın.
        e.stopPropagation()
        onClose()
      }}
    >
      <div key={item.id} className="cal-dp-in">
        <header className="cal-stats-head cal-dp-head">
          <h2 id="cal-dp-title" ref={title} tabIndex={-1}>
            {t(`calendar.page.kind.${item.kind}`)}
          </h2>
          <button
            type="button"
            className="cal-dp-close"
            aria-label={t("calendar.page.detail.close")}
            title={t("calendar.page.detail.close")}
            onClick={onClose}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>
        {item.kind === "myLeave" ? (
          <LeavePane item={item} />
        ) : OWN_BODY.has(item.kind) ? (
          <div className="cal-dp-body cal-dp-own">
            <DetailBody item={item} access={access} board={board} onClose={onClose} />
          </div>
        ) : (
          <MeetingPanel item={item} />
        )}
      </div>
    </aside>
  )
}

import { useEffect, useId, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { useLocale } from "@/hooks/useLocale"
import { StatFace } from "./StatFace"
import { StatTip } from "./StatTip"
import { StatTipBody } from "./StatTipBody"

/**
 * Telefonda satır, çekmecenin içinde akordeon gibi açılır (balon çekmecenin üstünde ikinci bir
 * yüzey olurdu): aynı kart gövdesi satırın altında. Bir eylem önce çekmeceyi kapatır, yeni yüzeyi bir
 * kare sonra açar (`StatTip`teki gibi). Açılan blok görünür alana kaydırılır. `anchorRef`:
 * çekmece kapanınca da sayfada kalan öğe (özet çubuğu): eylemin odak ve konum çapası o olur.
 */
function AccordionRow({ row, tip, open, onToggle, actions, onClose, anchorRef }) {
  const id = useId()
  const button = useRef(null)
  const panel = useRef(null)
  useEffect(() => {
    if (!open) return
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    panel.current?.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" })
  }, [open])
  const run = (fn) => {
    onClose?.()
    requestAnimationFrame(() => {
      const bar = anchorRef?.current
      const el = bar?.isConnected ? bar : button.current
      if (!el?.isConnected) return
      el.focus({ preventScroll: true })
      fn(el)
    })
  }
  return (
    <>
      <button
        ref={button}
        type="button"
        id={`${id}-row`}
        className="cal-stat-btn"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={onToggle}
      >
        <StatFace row={row} />
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="cal-ic cal-stat-chev"
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          ref={panel}
          id={`${id}-body`}
          className="cal-tip-inline"
          role="region"
          aria-labelledby={`${id}-row`}
        >
          <StatTipBody row={row} tip={tip} actions={actions} run={run} inline />
        </div>
      )}
    </>
  )
}

// Özetin grupları: bakiye (döneme bağlı değil) · dönemin işleri · dönemin izin ve özel günleri.
// Listede olmayan yeni satır son gruba düşer.
const GROUPS = [
  { key: "balance", ids: ["available", "pending", "claim"] },
  { key: "work", ids: ["meetings", "awaiting", "tasks"] },
  { key: "days", ids: ["myLeave", "team", "celebrations", "holidays"] },
]

function groupRows(rows) {
  const known = new Set(GROUPS.flatMap((g) => g.ids))
  return GROUPS.map((g, i) => ({
    key: g.key,
    rows: [
      ...g.ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean),
      ...(i === GROUPS.length - 1 ? rows.filter((r) => !known.has(r.id)) : []),
    ],
  })).filter((g) => g.rows.length)
}

/**
 * Özet satırları, gruplu (başlıkta dönemin adı: "Bu hafta"; satırda tekrar yazılmaz): yumuşak renkli simge kutusu, başlık, alt yazı (dönemin adı: "Bu hafta"). Satırın
 * tamamı bir düğme: masaüstünde üstüne gelince açılan kart (`StatTip`), `accordion` (telefon
 * çekmecesi) satırın altında açılan blok. `lists`: `statTips` çıktısı (satır kimliğine göre),
 * `actions`: `{ open(öğe, satır), holidays(satır), newLeave?(satır) }`.
 */
export function StatsList({
  rows,
  lists,
  loading,
  actions,
  accordion = false,
  onClose,
  anchorRef,
}) {
  const { t } = useLocale()
  const [openId, setOpenId] = useState(null)
  if (loading) {
    return (
      <ul className="cal-stats-list" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="cal-stat cal-stat-skel">
            <span className="cal-stat-ic ms-skeleton" />
            <span className="cal-stat-text">
              <span className="ms-skeleton cal-skel-line" />
              <span className="ms-skeleton cal-skel-line" data-short="" />
            </span>
          </li>
        ))}
      </ul>
    )
  }
  const renderRow = (row) => (
    <li key={row.id} className="cal-stat" data-tone={row.tone}>
      {accordion ? (
        <AccordionRow
          row={row}
          tip={lists[row.id]}
          open={openId === row.id}
          onToggle={() => setOpenId(openId === row.id ? null : row.id)}
          actions={actions}
          onClose={onClose}
          anchorRef={anchorRef}
        />
      ) : (
        <StatTip row={row} tip={lists[row.id]} actions={actions} />
      )}
    </li>
  )
  return (
    <div className="cal-stat-groups">
      {groupRows(rows).map((group) => {
        // Dönem satırlarının alt yazısı dönemin adı: grubun başlığına çıkar, satırda tekrar yok.
        const period = group.key === "balance" ? null : group.rows[0]?.sub
        const shown = period ? group.rows.map((r) => ({ ...r, sub: null })) : group.rows
        return (
          <section
            key={group.key}
            className="cal-stat-group"
            aria-label={t(`calendar.page.stats.group.${group.key}`)}
          >
            <h3 className="cal-stat-group-head">
              <span>{t(`calendar.page.stats.group.${group.key}`)}</span>
              {period && <span>{period}</span>}
            </h3>
            <ul className="cal-stats-list">{shown.map(renderRow)}</ul>
          </section>
        )
      })}
    </div>
  )
}

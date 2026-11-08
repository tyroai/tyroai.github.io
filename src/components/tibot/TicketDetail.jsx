import "@/lib/i18n/tibot"
import "@/lib/i18n/selfService"
import { HugeiconsIcon } from "@hugeicons/react"
import LockKeyIcon from "@hugeicons/core-free-icons/LockKeyIcon"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import { RecordHeader, RecordTag } from "@/components/record-window/RecordHeader"
import { RecordHero } from "@/components/record-window/RecordHero"
import { RecordInfoList } from "@/components/record-window/RecordInfoList"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { formatRelative } from "@/lib/date"
import { getDateTimeFormat, pluralKey } from "@/lib/intl-cache"
import { initialsOf } from "@/lib/personInitials"
import { NoteMedia } from "./NoteMedia"
import { TicketCode } from "./TicketCode"
import { TicketOwner, TicketPersonName } from "./TicketPerson"
import {
  isOverdue,
  noteText,
  splitLinks,
  statusKey,
  statusLabel,
  statusTone,
  targetDate,
} from "@/lib/tibot/tibotModel"

const DAY = 24 * 60 * 60 * 1000
// Kayıt penceresinin tonları (`components/record-window`): bilgi = marka.
const RW_TONE = {
  info: "brand",
  warning: "warning",
  danger: "danger",
  success: "success",
  neutral: "neutral",
}
const CATEGORIES = [
  "incident",
  "rfc",
  "rfi",
  "reservation",
  "order",
  "fulfillment",
  "complaint",
  "compliment",
  "other",
]
const IMPACTS = ["low", "medium", "high", "top"]

const stamp = (iso, locale, opts = { dateStyle: "medium", timeStyle: "short" }) =>
  iso ? getDateTimeFormat(locale, opts).format(new Date(iso)) : null

/** Metindeki adresler tıklanır, gerisi düz metin (HTML yorumlanmaz). */
function Linked({ text }) {
  return splitLinks(text).map(([part, link], i) =>
    link ? (
      <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="tb-link">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

/** Hedef kartı (kaydın tek sayısı): hedef tarih, kaç gün kaldı ya da geçti. */
function TargetCard({ row, mine }) {
  const { t, locale } = useLocale()
  const today = useToday()
  const target = targetDate(row)
  const late = isOverdue(row)
  const days = (n) => t(pluralKey("selfService.days", locale, n), { n })
  let sub = t("tibot.window.noTarget")
  if (row.status === "waiting_for_customer") sub = statusLabel(t, "waiting_for_customer", mine)
  else if (target) {
    const diff = Math.round((Date.parse(target) - today.getTime()) / DAY)
    sub =
      diff === 0
        ? t("tibot.window.today")
        : late
          ? t("tibot.window.late", { days: days(Math.abs(diff)) })
          : t("tibot.window.left", { days: days(diff) })
  }
  return (
    <RecordHero
      title={t("tibot.window.target")}
      sub={sub}
      value={target ? stamp(target, locale, { day: "numeric", month: "short" }) : "—"}
      caption={target ? stamp(target, locale, { hour: "2-digit", minute: "2-digit" }) : null}
      tone={late ? "danger" : RW_TONE[statusTone(statusKey(row))]}
    />
  )
}

function infoRows(row, t, locale) {
  const by = row.requestedBy?.name
  const rows = [
    {
      key: "assignee",
      label: t("tibot.fact.assignee"),
      value: row.member?.name ? <TicketPersonName name={row.member.name} /> : t("tibot.unassigned"),
    },
    { key: "team", label: t("tibot.fact.team"), value: row.team?.name },
    {
      key: "service",
      label: t("tibot.fact.service"),
      value: row.serviceInstance?.name,
      caption: row.serviceInstance?.service?.name,
    },
    CATEGORIES.includes(row.category) && {
      key: "category",
      label: t("tibot.fact.category"),
      value: t(`tibot.category.${row.category}`),
    },
    IMPACTS.includes(row.impact) && {
      key: "impact",
      label: t("tibot.fact.impact"),
      value: t(`tibot.impact.${row.impact}`),
    },
    by &&
      by !== row.requestedFor?.name && {
        key: "by",
        label: t("tibot.fact.requestedBy"),
        value: <TicketPersonName name={by} />,
      },
    { key: "created", label: t("tibot.fact.created"), value: stamp(row.createdAt, locale) },
    {
      key: "updated",
      label: t("tibot.fact.updated"),
      value: formatRelative(row.updatedAt, locale),
      caption: stamp(row.updatedAt, locale),
    },
  ]
  return rows.filter((r) => r && r.value)
}

/**
 * Talebin içi — Self Servis kaydının kalıbında (`components/record-window`): başlık (simge, konu,
 * numara, durum etiketleri, talep sahibi), hedef kartı, ayrıntılar ve notlar. Pencerede ve telefon
 * çekmecesinde aynı. `row` listeden anında, `notes` detay gelince.
 */
export function TicketContent({ row, notes, status, mine = false }) {
  const { t, locale } = useLocale()
  const key = statusKey(row)
  const tone = RW_TONE[statusTone(key)]
  return (
    <>
      <RecordHeader
        icon={Ticket01Icon}
        tone={isOverdue(row) ? "danger" : tone}
        title={row.subject}
        titleExtra={<TicketCode id={row.requestId} />}
        sub={row.serviceInstance?.service?.name ?? row.team?.name}
        tags={
          <>
            <RecordTag tone={tone === "neutral" ? undefined : tone} label={t("tibot.fact.status")}>
              {statusLabel(t, key, mine)}
            </RecordTag>
            {isOverdue(row) && (
              <RecordTag tone="danger" icon={Clock01Icon}>
                {t("tibot.overdue")}
              </RecordTag>
            )}
          </>
        }
      >
        <TicketOwner
          name={row.requestedFor?.name ?? row.requestedBy?.name}
          role={t("tibot.fact.requester")}
        />
      </RecordHeader>
      <TargetCard row={row} mine={mine} />
      <RecordInfoList title={t("tibot.window.details")} rows={infoRows(row, t, locale)} />
      <TicketNotes notes={notes} status={status} />
    </>
  )
}

function Note({ note }) {
  const { t, locale } = useLocale()
  const { text, refs } = noteText(note.text)
  const name = note.person?.name ?? ""
  return (
    <li className="tb-note">
      <span aria-hidden="true" className="tb-avatar">
        {initialsOf(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="tb-note-meta">
          <TicketPersonName name={name} align="start" className="tb-note-name" />
          <time dateTime={note.createdAt} title={stamp(note.createdAt, locale)}>
            {formatRelative(note.createdAt, locale)}
          </time>
          {note.internal && (
            <span className="tb-internal">
              <HugeiconsIcon icon={LockKeyIcon} strokeWidth={2} aria-hidden="true" />
              {t("tibot.internal")}
            </span>
          )}
        </p>
        {text && (
          <p className="tb-note-text">
            <Linked text={text} />
          </p>
        )}
        <NoteMedia refs={refs} attachments={note.textAttachments?.nodes} />
      </div>
    </li>
  )
}

/** Notlar: en yenisi üstte (son durum ilk bakışta), iç notlar işaretli. */
function TicketNotes({ notes, status }) {
  const { t } = useLocale()
  return (
    <section className="rw-info" aria-busy={status === "loading" || undefined}>
      <h3 className="rw-section">
        {notes ? t("tibot.notes", { n: notes.length }) : t("tibot.notesTitle")}
      </h3>
      {status === "loading" && (
        <div aria-hidden="true" className="space-y-2">
          <span className="ms-skeleton block h-14 rounded-xl" />
          <span className="ms-skeleton block h-14 rounded-xl" />
        </div>
      )}
      {(status === "error" || status === "notFound") && (
        <p role="status" className="tb-muted">
          {t(status === "notFound" ? "tibot.detailMissing" : "tibot.detailFailed")}
        </p>
      )}
      {status === "ready" &&
        (notes?.length ? (
          <ol className="tb-notes">
            {[...notes].reverse().map((n) => (
              <Note key={n.id} note={n} />
            ))}
          </ol>
        ) : (
          <p className="tb-muted">{t("tibot.noNotes")}</p>
        ))}
    </section>
  )
}

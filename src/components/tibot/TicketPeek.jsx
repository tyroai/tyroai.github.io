import "@/lib/i18n/tibot"
import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import LockKeyIcon from "@hugeicons/core-free-icons/LockKeyIcon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useLocale } from "@/hooks/useLocale"
import { formatRelative } from "@/lib/date"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { initialsOf } from "@/lib/personInitials"
import { isOverdue, noteText, targetDate } from "@/lib/tibot/tibotModel"
import { OverdueBadge, TicketStatus } from "./TicketStatus"
import { useTicket } from "./useTicket"
import "./tibot.css"

// Fare satırda bu kadar durunca açılır: listede gezinirken kart (ve not isteği) çıkmaz.
const OPEN_DELAY = 550

function Fact({ label, children }) {
  if (!children) return null
  return (
    <div className="tb-peek-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Kartın içi: açılınca ayrıntı ve notlar istenir (5 dk bellek; pencere de aynısını kullanır). */
function PeekBody({ row, bucket }) {
  const { t, locale } = useLocale()
  const ticket = useTicket(row)
  const head = ticket.data?.request ?? row
  const notes = ticket.data?.notes ?? []
  const last = notes[notes.length - 1]
  const note = last ? noteText(last.text) : null
  const target = targetDate(head)
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
          #{head.requestId}
        </span>
        <TicketStatus row={head} mine={bucket === "mine" && !ticket.data?.staff} />
        {isOverdue(head) && <OverdueBadge />}
      </div>
      <p className="tb-peek-subject">{head.subject}</p>
      <dl className="tb-peek-facts">
        <Fact label={t("tibot.fact.requester")}>
          {head.requestedFor?.name ?? head.requestedBy?.name}
        </Fact>
        <Fact label={t("tibot.fact.assignee")}>{head.member?.name ?? t("tibot.unassigned")}</Fact>
        <Fact label={t("tibot.fact.team")}>{head.team?.name}</Fact>
        <Fact label={t("tibot.window.target")}>
          {target
            ? getDateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
                new Date(target),
              )
            : null}
        </Fact>
      </dl>
      <div className="tb-peek-note">
        <p className="tb-peek-label">{t("tibot.lastNote")}</p>
        {ticket.status === "loading" ? (
          <span aria-hidden="true" className="ms-skeleton mt-1 block h-10 rounded-lg" />
        ) : ticket.status !== "ready" ? (
          <p className="tb-muted">{t("tibot.detailFailed")}</p>
        ) : !last ? (
          <p className="tb-muted">{t("tibot.noNotes")}</p>
        ) : (
          <>
            <p className="tb-note-meta">
              <span aria-hidden="true" className="tb-avatar tb-avatar--sm">
                {initialsOf(last.person?.name ?? "")}
              </span>
              <span className="tb-note-name">{last.person?.name}</span>
              <time dateTime={last.createdAt}>{formatRelative(last.createdAt, locale)}</time>
              {last.internal && (
                <span className="tb-internal">
                  <HugeiconsIcon icon={LockKeyIcon} strokeWidth={2} aria-hidden="true" />
                  {t("tibot.internal")}
                </span>
              )}
            </p>
            <p className="tb-peek-text">{note.text || t("tibot.images", { n: note.images })}</p>
          </>
        )}
      </div>
    </>
  )
}

/**
 * Talep satırının üzerinde durunca açılan kart (yalnız farede; dokunuş satırı açar): numara,
 * durum, konu, kişiler, hedef ve SON NOT. Not ayrıntı isteğiyle gelir — kart açılınca, bir kez.
 * `children`: satırın düğmesi (tetik). Satıra basınca kart kapanır ve fare satıra yeniden girene
 * dek açılmaz: Radix fare ve odak için iki bekleme kuruyor, çıkışta yalnız birini siliyor; basınca
 * kalan bekleme dolup kart açılan pencerenin üstüne çıkıyordu (pencere kapanınca dönen odak da).
 */
export function TicketPeek({ row, bucket, side = "right", children }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const muted = useRef(false)
  return (
    <HoverCard
      open={open}
      onOpenChange={(next) => setOpen(next && !muted.current)}
      openDelay={OPEN_DELAY}
      closeDelay={120}
    >
      <HoverCardTrigger
        asChild
        onClick={() => {
          muted.current = true
          setOpen(false)
        }}
        onPointerEnter={() => {
          muted.current = false
        }}
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="start"
        sideOffset={10}
        collisionPadding={12}
        aria-label={t("tibot.window.kind")}
        className="tb-peek w-80"
      >
        <PeekBody row={row} bucket={bucket} />
      </HoverCardContent>
    </HoverCard>
  )
}

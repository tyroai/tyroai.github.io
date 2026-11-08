import { useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonCard } from "@/components/common/PersonCard"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { useLocale } from "@/hooks/useLocale"
import { keyToDay } from "@/features/calendar/lib/range"
import { todoTaskUrl } from "@/features/calendar/lib/urls"
import { teamsChat } from "@/lib/celebrate"
import { bridgeFor } from "@/lib/leaveBridges"
import { addDays } from "@/lib/leaveDays"
import { dateFull, dayMonth, rangeText, weekday } from "./format"
import { ITEM_ICONS } from "./icons"
import { useLeaveDesk } from "./leaveDeskContext"

/** Ayrıntı yüzeylerinin ortak parçaları: başlık, bilgi satırı, eylem satırı. */
function Head({ item, icon, title, sub }) {
  const Icon = ITEM_ICONS[icon] ?? Calendar03Icon
  return (
    <header className="cal-d-head" data-tone={item.kind}>
      <span className="cal-d-ic">
        <HugeiconsIcon icon={Icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="cal-d-titles">
        <h3>{title}</h3>
        {sub}
      </div>
    </header>
  )
}

function Row({ icon, children }) {
  return (
    <p className="cal-d-row">
      <HugeiconsIcon icon={icon} className="cal-ic" strokeWidth={1.8} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

/** Görev: teslim, liste, önem; eylemler: Tamamlandı (✓) · To-Do'da aç. */
export function TaskDetail({ item, board, access, onClose }) {
  const { locale, t } = useLocale()
  const [busy, setBusy] = useState(false)
  const task = item.source
  const list = board?.lists?.find((l) => l.id === task.listId)?.name
  const link = access.todo ? todoTaskUrl(task.id) : null
  const due = keyToDay(task.dueKey)
  async function finish() {
    setBusy(true)
    const ok = await board.updateTask(task.id, { done: true })
    setBusy(false)
    if (ok) onClose()
  }
  return (
    <div className="cal-d">
      <Head item={item} icon={item.icon} title={item.title} />
      <Row icon={Clock01Icon}>
        {item.state === "overdue"
          ? t("todo.due.overdue", { date: dayMonth(due, locale) })
          : dateFull(due, locale)}
      </Row>
      {list && <Row icon={Calendar03Icon}>{t("calendar.page.task.list", { name: list })}</Row>}
      {task.importance === "high" && <Row icon={StarIcon}>{t("calendar.page.task.important")}</Row>}
      <div className="cal-d-actions">
        {!task.done && board && (
          <button
            type="button"
            className="cal-act"
            data-primary=""
            disabled={busy || task.pending}
            onClick={finish}
          >
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              className="cal-ic"
              strokeWidth={2}
              aria-hidden="true"
            />
            {t("todo.check.done")}
          </button>
        )}
        {link && (
          <Link className="cal-act" to={link} onClick={onClose}>
            {t("calendar.page.task.open")}
          </Link>
        )}
      </div>
    </div>
  )
}

/** Ekip izni: kişi, "İzinde", aralık — tür yok. Eylem: Teams'te mesaj. */
export function TeamLeaveDetail({ item }) {
  const { locale, t } = useLocale()
  const { person, leave } = item.source
  const photos = usePeoplePhotos([person.address])
  const chat = person.upn || person.address
  return (
    <div className="cal-d">
      <header className="cal-d-head cal-d-person" data-tone={item.kind}>
        <PersonAvatar
          name={person.name}
          photo={photos.get(String(person.address ?? "").toLowerCase())}
          className="cal-avatar"
        />
        <div className="cal-d-titles">
          <h3>{person.name}</h3>
          <p>{item.tail}</p>
        </div>
      </header>
      <Row icon={Calendar03Icon}>{rangeText(leave.start, leave.end, locale)}</Row>
      {chat && (
        <div className="cal-d-actions">
          <a className="cal-act" href={teamsChat(chat)} target="_blank" rel="noopener noreferrer">
            {t("calendar.page.team.chat")}
          </a>
        </div>
      )}
    </div>
  )
}

/** Kutlama: Kişi kartı (Kutla menüsü, sohbet, e-posta…), bağlam şeridiyle. */
export function CelebrationDetail({ item, onClose }) {
  const { person, occasion } = item.source
  const context = { kind: occasion.kind, years: occasion.years }
  return (
    <PersonCard
      person={{ name: person.name, address: person.address || person.upn, title: person.title }}
      context={context}
      onDone={onClose}
    />
  )
}

/**
 * Resmî tatil: ad, tarih, arife notu; köprü varsa "{gün} izin alırsan {n} gün tatil" + İzin iste
 * (izin formu takvimin üstünde, köprü günü dolu açılır).
 */
export function HolidayDetail({ item, access, onClose }) {
  const { locale, t } = useLocale()
  const desk = useLeaveDesk()
  const { holiday, eve } = item.source
  const from = keyToDay(holiday.start)
  const to = addDays(from, holiday.days - 1)
  const bridge = eve ? null : bridgeFor({ ...holiday, from, to })
  return (
    <div className="cal-d">
      <Head item={item} icon="flag" title={t(`widgets.holiday.name.${holiday.key}`)} />
      <Row icon={Calendar03Icon}>
        {eve
          ? t("widgets.holiday.eve", { date: dayMonth(keyToDay(holiday.eve), locale) })
          : rangeText(from, to, locale)}
      </Row>
      {!eve && <Row icon={Clock01Icon}>{t("widgets.holiday.days", { n: holiday.days })}</Row>}
      {!eve && holiday.eve && (
        <Row icon={Clock01Icon}>
          {t("widgets.holiday.eve", { date: dayMonth(keyToDay(holiday.eve), locale) })}
        </Row>
      )}
      {bridge && (
        <p className="cal-d-note" data-tone="myLeave">
          {t("widgets.holiday.bridge", { day: weekday(bridge.bridge, locale), n: bridge.total })}
        </p>
      )}
      {bridge && access.selfService && desk && (
        <div className="cal-d-actions">
          <button
            type="button"
            className="cal-act"
            onClick={() => {
              desk.newLeave(bridge.bridge)
              onClose()
            }}
          >
            {t("calendar.page.holiday.askLeave")}
          </button>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useRef } from "react"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import TaskAdd01Icon from "@hugeicons/core-free-icons/TaskAdd01Icon"
import { NewMenuOption as Option } from "@/components/common/new-menu/NewMenuOption"
import { useLocale } from "@/hooks/useLocale"
import { clock, dayFull, dayMonth } from "./format"
import { useLeaveDesk } from "./leaveDeskContext"
import { preloadMeeting } from "./meetingLoader"
import { CalendarNarrate } from "./narrate/CalendarNarrate"
import { useCalendarNarrate } from "./narrate/useCalendarNarrate"
import { preloadTask } from "./taskLoader"

/**
 * "Yeni" menüsü: seçili gün (ve boş saate basıldıysa o saat) için üç seçenek. İzin talebi
 * Self Servis'in formunu takvimin ÜSTÜNDE, günü dolu açar (izin masası; yalnız Self Servis
 * kapısı açıksa); Görev takvimin üstünde yeni görev penceresini açar (`onTask`: To-Do'ya, teslim
 * seçili gün; yalnız To-Do kapısı açıksa); Toplantı yeni toplantı penceresini açar (`onMeeting`,
 * Outlook'a gidilmez). En üstte Anlat kutusu (Türkçede): bir cümle doğru formu ya da pencereyi dolu
 * açar; cümlede yazılmayan gün ve saat bu menünün açıldığı gün ve saattir (`target`). Aynı gövde
 * masaüstünde popover (buzlu cam yüzey, `nm-glass`), telefonda çekmecede. Seçenek satırı Self
 * Servis'in Yeni menüsüyle ortak (`common/new-menu`).
 */
export function NewMenu({ target, access, board, onClose, onMeeting, onTask }) {
  const { locale, t } = useLocale()
  const desk = useLeaveDesk()
  const hasBoard = Boolean(board)
  const root = useRef(null)
  const kinds = useMemo(
    () => ({ leave: Boolean(access.selfService && desk), task: Boolean(access.todo && board) }),
    [access.selfService, access.todo, desk, board],
  )
  const nar = useCalendarNarrate({ target, kinds })
  // Pencerelerin parçaları menü açılırken iner.
  useEffect(preloadMeeting, [])
  useEffect(() => {
    if (hasBoard) preloadTask()
  }, [hasBoard])
  const { day, minute } = target
  const hasTime = minute != null
  const when = hasTime
    ? `${dayFull(day, locale)} · ${clock(new Date(2000, 0, 1, 0, minute), locale)}`
    : dayFull(day, locale)

  // Anlat'ın okuduğu cümle: doğru pencere ya da form dolu açılır, kayıt kullanıcının onayıyla.
  const openNarrated = (r) => {
    if (r.kind === "task") onTask(target, r.values)
    else if (r.kind === "meeting") onMeeting(target, r.values)
    else desk.newLeave(day, target.anchor, { values: r.values, text: r.text })
    onClose()
  }
  // Cümle yazılırken seçenekler çekilir, yerine "anladığım" çipleri gelir.
  const plain = !(nar.enabled && nar.typing)

  return (
    <div className="cal-new" ref={root}>
      {nar.enabled && (
        <CalendarNarrate
          nar={nar}
          onOpen={openNarrated}
          onDown={() => root.current?.querySelector(".nm-opt")?.focus()}
        />
      )}
      {plain && <p className="cal-new-when">{when}</p>}
      {plain && access.selfService && desk && (
        <Option
          tone="myLeave"
          icon={Beach02Icon}
          title={t("calendar.page.new.leave")}
          sub={t("calendar.page.new.leaveSub")}
          onClick={() => {
            desk.newLeave(day, target.anchor)
            onClose()
          }}
        />
      )}
      {plain && access.todo && board && (
        <Option
          tone="task"
          icon={TaskAdd01Icon}
          title={t("calendar.page.new.task")}
          sub={t("calendar.page.new.taskSub", { date: dayMonth(day, locale) })}
          onClick={() => {
            onTask(target)
            onClose()
          }}
        />
      )}
      {plain && (
        <Option
          tone="meeting"
          icon={CalendarAdd01Icon}
          title={t("calendar.page.new.meeting")}
          sub={t("calendar.page.new.meetingSub")}
          onClick={() => {
            onMeeting(target)
            onClose()
          }}
        />
      )}
    </div>
  )
}

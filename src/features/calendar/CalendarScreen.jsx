import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { PageHeading } from "@/components/common/SectionHeading"
import { Tour } from "@/components/tour/Tour"
import { useNarrow } from "@/features/widgets/useNarrow"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useSharedPeople } from "@/hooks/useSharedPeople"
import { markedDays } from "@/features/calendar/lib/layout"
import { personLayer } from "@/lib/calendar/people"
import { periodOf } from "@/features/calendar/lib/range"
import { weekendDays } from "@/features/calendar/lib/weekend"
import { ActiveItemContext } from "./activeItem"
import { AgendaList, WeekStrip } from "./AgendaList"
import { AgendaWeek } from "./AgendaWeek"
import { AnchoredPopover } from "./AnchoredPopover"
import { CalendarToolbar } from "./CalendarToolbar"
import { DetailPanel } from "./detail/DetailPanel"
import { EventDetail } from "./EventDetail"
import { HolidayList } from "./HolidayList"
import { NewButton, SearchBox, SourceButtons } from "./HeaderTools"
import { LayerChips } from "./LayerChips"
import { LayersButton } from "./LayersButton"
import { useUrlCommand } from "@/hooks/useUrlCommand"
import { LazyMeetingDialog } from "./LazyMeetingDialog"
import { LazyTaskDialog } from "./LazyTaskDialog"
import { LeaveRequestsTable } from "./LeaveRequestsTable"
import { LeaveStatsPanel } from "./LeaveStatsPanel"
import { useLeaveDesk } from "./leaveDeskContext"
import { MonthGrid } from "./MonthGrid"
import { NewMenu } from "./NewMenu"
import { ViewTools } from "./ViewTools"
import { WeekGrid } from "./WeekGrid"
import { useCalendarItems } from "./useCalendarItems"
import { useCalendarPanels } from "./useCalendarPanels"
import { useCalendarRefresh } from "./useCalendarRefresh"
import { useCalendarState } from "./useCalendarState"
import { useViewTools } from "./hooks/useViewTools"
import { useSidePanel } from "./hooks/useSidePanel"
import "./calendar.css"
import "./calendarHeader.css"
import "./calendarGrid.css"
import "./calendarEvent.css"
import "./calendarMonth.css"
import "./calendarChips.css"
import "./calendarPeople.css"
import "./calendarPopovers.css"
import "./calendarPanels.css"
import "./calendarTouch.css"
import "./calendarDense.css"

// Izgara sütunu bu genişliğin altında hafta üç gün gösterilir (tablet dikey): yedi günde gün sütunu
// ≥ ~84 px kalır. `calendarPanels.css`teki "özet sağda" eşiği de bu sayıdan türer.
const WEEK_MIN_PX = 640

// "Kişi ekle" düzenleyicisi ayrı parça (Pano'nun widget'ının düzenleyicisi); sayfa boştayken ve
// düğmenin üstüne gelince önceden iner — yoksa ilk basışta kutu boş açılıp sonra doluyordu
// (ürün sahibi: "takılarak açılıyor").
// İndiyse bileşen doğrudan çizilir: `lazy` önceden inmiş parçada da bir kare askıya alıyordu.
let LoadedPeopleEditor = null
const loadPeopleEditor = () =>
  import("./PeopleEditor").then((m) => {
    LoadedPeopleEditor = m.default
    return m
  })
const PeopleEditor = lazy(loadPeopleEditor)
const preloadPeopleEditor = () => void loadPeopleEditor().catch(() => {})

/** Boş saate basılan noktayı popover'a sanal bir bağlantı olarak verir. */
const pointAt = (x, y) => ({ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) })

/**
 * Takvim sayfasının gövdesi: araç çubuğu, katman çipleri, görünüm (hafta · gün · ay; telefonda
 * hafta şeridi + ajanda), sağda "Takvim özeti" (dar kapta altta, telefonda tek satır + çekmece;
 * satırlar görünen döneme göre, üstüne gelince saydığı kayıtların kartı), altta "İzinler ve
 * talepler". Veriyi kapıya bağlı kaynaklar (`tasks`, `leave`; kapalıysa null) ve Outlook beslerken
 * yerleşimi `lib/calendar/` hesaplar. Ayrıntı ve "Yeni" tek popover örneği.
 */
export function CalendarScreen({ access, tasks, leave }) {
  const { t } = useLocale()
  const desk = useLeaveDesk()
  const phone = useIsMobile()
  const column = useRef(null)
  const narrow = useNarrow(column, WEEK_MIN_PX)
  // Özet ızgaranın sağındaysa etkinliğin ayrıntısı onun yerinde açılır; değilse popover/çekmece.
  const side = useSidePanel(column, !phone)
  const s = useCalendarState({ phone, cols: narrow ? 3 : 7 })
  const tools = useViewTools()
  // Paylaşılan takvimler: header panelindeki liste, aynı kayıt (kararlı dizi: kişi başına tek istek).
  const [people, setPeople] = useSharedPeople()
  const data = useCalendarItems({
    anchor: s.anchor,
    today: s.today,
    firstDay: s.firstDay,
    range: s.range,
    layers: s.layers,
    query: s.query,
    tasks,
    leave,
    people,
  })
  const period = useMemo(() => periodOf(s.view, s.range.days), [s.view, s.range.days])
  const panels = useCalendarPanels({
    access,
    leave,
    status: data.status,
    events: data.events,
    items: data.all,
    period,
    today: s.today,
    windowLoading: data.loading,
  })
  const marked = useMemo(() => markedDays(data.items, s.range.days), [data.items, s.range.days])
  const sync = useCalendarRefresh({ data, tasks, leave })
  // Boş hafta sonu gizli (kayıt varsa ya da kişi isterse görünür); telefonun hafta şeridi tam kalır.
  const weekend = useMemo(
    () => weekendDays(s.range.days, { view: s.view, show: s.showWeekend, marked }),
    [s.range.days, s.view, s.showWeekend, marked],
  )

  const [detail, setDetail] = useState(null)
  const [adding, setAdding] = useState(null)
  const [meeting, setMeeting] = useState(null)
  const [newTask, setNewTask] = useState(null)
  const [editing, setEditing] = useState(null)
  const meetings = useRef(0)
  const taskOpens = useRef(0)
  const [holidays, setHolidays] = useState(null)
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const id = idle(preloadPeopleEditor)
    return () => cancel(id)
  }, [])
  const openDetail = (item, anchor) => {
    setAdding(null)
    // Kendi iznim: Self Servis'in kayıt ayrıntısı — geniş kapta panelde, darda pencerede; ekip izni
    // gizlilik gereği türsüz ayrıntıda kalır.
    if (item.kind === "myLeave" && desk && !side) {
      setDetail(null)
      desk.openLeave(item.source)
      return
    }
    setDetail({ item, anchor })
  }
  // Paneldeki ayrıntı kapanınca odak açan bloğa (ya da özetin satırına) döner: özet bir kare sonra
  // yeniden görünür.
  const closeDetail = () => {
    const from = detail?.anchor
    setDetail(null)
    if (side)
      requestAnimationFrame(() => from?.isConnected && from.focus?.({ preventScroll: true }))
  }
  const panelItem = side ? detail?.item : null
  const openAdd = (target) => {
    setDetail(null)
    setAdding(target)
  }
  // Özet kartlarının eylemleri: ayrıntı, tatil listesi, (izin kapısı açıksa) yeni izin talebi.
  const statActions = {
    open: openDetail,
    holidays: setHolidays,
    newLeave: desk ? (el) => desk.newLeave(s.today, el) : null,
  }
  // Çıkarılan kişinin kapalı katmanı da sıfırlanır: sonra yeniden eklenince kapalı gelmesin.
  const removePerson = (p) => {
    const layer = personLayer(p.address)
    if (s.layers[layer] === false) s.toggleLayer(layer)
    setPeople(people.filter((x) => x.address !== p.address))
  }
  // Yeni toplantı penceresi: her açılış taze form (`seq`); `initial`: Anlat'ın doldurduğu alanlar.
  const openMeeting = ({ day, minute }, initial = null) =>
    setMeeting({ day, minute, initial, seq: ++meetings.current })
  // `?new=meeting`: başka yerden (Denetim Merkezi'nin kısayolu) yeni toplantı.
  useUrlCommand("new", "meeting", () => openMeeting({ day: s.today, minute: null }))
  // Yeni görev penceresi: aynı şekilde; `initial`: Anlat'ın okuduğu başlık ve teslim günü.
  const openTask = ({ day, minute }, initial = null) =>
    setNewTask({ day, minute, initial, seq: ++taskOpens.current })
  // `?new=task`: başka yerden (telefonun karşılama çekmecesi › Yeni › Görev) yeni görev.
  useUrlCommand("new", "task", () => openTask({ day: s.today, minute: null }))
  const onSlot = ({ day, minute, x, y }) => openAdd({ day, minute, anchor: pointAt(x, y) })
  const grid = { items: data.items, today: s.today, onOpen: openDetail, onDay: s.openDay }

  return (
    <ActiveItemContext value={panelItem?.id ?? null}>
      <div className="cal-page" data-phone={phone || undefined}>
        <PageHeading
          className="cal-heading"
          eyebrow={t("calendar.page.eyebrow")}
          title={t("nav.calendar")}
          actions={
            <>
              <SearchBox value={s.query} onChange={s.setQuery} />
              <SourceButtons
                compact={phone || narrow}
                refreshing={sync.busy}
                people={data.people}
                layers={s.layers}
                onRefresh={sync.refresh}
                onAddPerson={setEditing}
                onPrefetch={preloadPeopleEditor}
              />
              {phone && (
                <LayersButton
                  layers={s.layers}
                  status={data.status}
                  details={data.details}
                  onToggle={s.toggleLayer}
                />
              )}
              {!phone && (
                <NewButton onClick={(el) => openAdd({ day: s.anchor, minute: null, anchor: el })} />
              )}
            </>
          }
        />
        <div className="cal-body">
          <section
            className="cal-card cal-main"
            aria-label={t("nav.calendar")}
            data-loading={data.loading || undefined}
          >
            <div className="cal-cal" ref={column}>
              <CalendarToolbar
                view={s.view}
                days={phone ? s.range.days : weekend.days}
                firstDay={s.firstDay}
                today={s.today}
                phone={phone}
                tools={phone ? null : <ViewTools view={s.view} tools={tools} />}
                onView={s.setView}
                onToday={s.goToday}
                onStep={s.step}
              />
              {/* Telefonda çip satırı yok: katmanlar başlıktaki tek düğmede (`LayersButton`). */}
              {!phone && (
                <LayerChips
                  layers={s.layers}
                  status={data.status}
                  details={data.details}
                  onToggle={s.toggleLayer}
                />
              )}
              {s.query && !data.items.length && (
                <p className="cal-empty" data-bar="" role="status">
                  {t("calendar.page.noResults")}
                </p>
              )}
              {phone ? (
                <>
                  <WeekStrip
                    days={s.range.days}
                    selected={s.anchor}
                    today={s.today}
                    marked={marked}
                    onSelect={s.setAnchor}
                    onSwipe={s.step}
                  />
                  <AgendaList day={s.anchor} items={data.items} onOpen={openDetail} />
                </>
              ) : s.view === "month" ? (
                <MonthGrid {...grid} days={s.range.days} anchor={s.anchor} onSlot={onSlot} />
              ) : tools.list ? (
                <AgendaWeek
                  days={weekend.days}
                  items={data.items}
                  today={s.today}
                  onOpen={openDetail}
                />
              ) : (
                <WeekGrid
                  {...grid}
                  days={weekend.days}
                  detail={s.view === "day"}
                  comfort={tools.comfort}
                  scrollKey={`${s.view}:${weekend.days.length}`}
                  // Hafta sonu ızgaranın kendi içinde katlanır (›/‹); kaydı varsa hep açık, katlama yok.
                  fold={
                    weekend.applies && !weekend.forced
                      ? { open: s.showWeekend, onToggle: () => s.setShowWeekend(!s.showWeekend) }
                      : null
                  }
                  onSlot={onSlot}
                />
              )}
            </div>
            {/* Telefonda da açık, takvimin altında: satırlar yerinde akordeonla açılır (çekmece yok). */}
            {panelItem && (
              <DetailPanel item={panelItem} access={access} board={tasks} onClose={closeDetail} />
            )}
            <LeaveStatsPanel
              hidden={Boolean(panelItem)}
              rows={panels.rows}
              lists={panels.lists}
              loading={panels.loading}
              actions={statActions}
              accordion={phone}
            />
          </section>
          {/* İzinler ve talepler listesi telefonda yok (Self Servis'te duruyor; özet yeterli). */}
          {!phone && access.selfService && panels.leaves && (
            <LeaveRequestsTable leaves={panels.leaves} />
          )}
        </div>
        {phone && (
          <NewButton
            floating
            onClick={(el) => openAdd({ day: s.anchor, minute: null, anchor: el })}
          />
        )}

        <EventDetail
          target={side ? null : detail}
          access={access}
          board={tasks}
          onClose={() => setDetail(null)}
        />
        {adding && (
          <AnchoredPopover
            key={`${adding.day.getTime()}:${adding.minute}`}
            anchor={adding.anchor}
            title={t("calendar.page.new")}
            className="cal-pop cal-pop-new nm-glass"
            align="end"
            onClose={() => setAdding(null)}
          >
            <NewMenu
              target={adding}
              access={access}
              board={tasks}
              onClose={() => setAdding(null)}
              onMeeting={openMeeting}
              onTask={openTask}
            />
          </AnchoredPopover>
        )}
        <LazyMeetingDialog target={meeting} onClose={() => setMeeting(null)} />
        <LazyTaskDialog target={newTask} board={tasks} onClose={() => setNewTask(null)} />
        {editing && (
          <AnchoredPopover
            anchor={editing}
            title={t("calendar.sharedAdd")}
            className="cal-pop"
            onClose={() => setEditing(null)}
          >
            {LoadedPeopleEditor ? (
              <LoadedPeopleEditor
                people={people}
                rows={data.people}
                layers={s.layers}
                onChange={setPeople}
                onToggle={s.toggleLayer}
                onRemove={removePerson}
                events={data.events}
              />
            ) : (
              <Suspense fallback={<div className="cal-people-wait" aria-hidden="true" />}>
                <PeopleEditor
                  people={people}
                  rows={data.people}
                  layers={s.layers}
                  onChange={setPeople}
                  onToggle={s.toggleLayer}
                  onRemove={removePerson}
                  events={data.events}
                />
              </Suspense>
            )}
          </AnchoredPopover>
        )}
        {holidays && (
          <AnchoredPopover
            anchor={holidays}
            title={t("calendar.page.holidays.title", { year: period.last.getFullYear() })}
            className="cal-pop"
            onClose={() => setHolidays(null)}
          >
            <HolidayList year={period.last.getFullYear()} />
          </AnchoredPopover>
        )}
        {/* İlk ziyarette kısa tur: kaynaklar okununca (hedefler ancak o zaman yerinde). */}
        <Tour id="calendar" page when={!data.loading} />
      </div>
    </ActiveItemContext>
  )
}

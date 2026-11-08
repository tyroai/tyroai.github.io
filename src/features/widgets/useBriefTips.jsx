import { useState } from "react"
import { TicketSheetLazy, TicketTipListLazy } from "@/components/tibot/TicketLazy"
import { InviteList } from "@/features/myspace/DayInvites"
import { MeetingList } from "@/features/myspace/MeetingList"
import { PreviewDialog } from "@/features/myspace/preview/PreviewDialog"
import { TipPreviewList } from "@/features/myspace/preview/TipPreviewList"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { requestPanel } from "@/lib/panelBus"
import { TIBOT_PATH } from "@/lib/tibotPolicy"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }

/**
 * Brifing maddelerinin ipuçları — Anasayfa özetinin kapı davranışı: ilk kayıtlar,
 * kayda basınca önizleme, dipte ilgili yer (panel, To-Do, Keşfet). Günün brifingi
 * ve Karşılama kartı ortak. `dialog`: telefonda önizleme penceresi, kartın
 * içine çizilir. `meetingsTip(list, title)`: cümledeki toplantı ifadesinin ipucu
 * (Anasayfa özetinin aynısı — listeden önizleme, dipte takvim).
 */
export function useBriefTips(data) {
  const { t, locale } = useLocale()
  const [preview, setPreview] = useState(null)
  const [ticket, setTicket] = useState(null) // ipucundan açılan Ticket talebi
  const { invites, unreadMail, tasks, feedItems, todoOpen, todoSynced, tibot } = data
  const openWith = (close, kind) => (item) => {
    close()
    requestAnimationFrame(() => setPreview({ kind, item }))
  }
  // Ticket ipucunun talepleri: ilk üçü, "+n daha"; talebe basınca pencere (ipucu önce kapanır).
  const ticketList = (kind) => (close) => (
    <TicketTipListLazy
      kind={kind}
      onOpen={(row) => {
        close()
        requestAnimationFrame(() => setTicket(row))
      }}
    />
  )
  const toTask = (x, i) => ({
    ...x,
    n: i + 1,
    openTo:
      todoSynced && todoOpen && !String(x.id).startsWith("tmp-")
        ? `/todo?${new URLSearchParams({ task: x.id })}`
        : undefined,
  })
  const taskList = (list) => (close) => (
    <TipPreviewList
      kind="task"
      items={list.map(toTask)}
      label={(x) => `${x.n}.`}
      value={(x) => x.title}
      labelClass="w-[1.25rem]"
      onOpen={openWith(close, "task")}
    />
  )
  const todoAction = todoOpen ? { label: t("myspace.tip.tasks.open"), to: "/todo" } : undefined

  const TIP = {
    invites: {
      title: t("myspace.tip.invites.title"),
      kicker: t("myspace.tip.meetings.kicker"),
      list: (close) => <InviteList invites={invites} onOpen={openWith(close, "event")} />,
      note: t("myspace.tip.invites.note"),
      action: { label: t("myspace.tip.meetings.open"), onClick: () => requestPanel("calendar") },
    },
    mail: {
      title: t("myspace.tip.mail.title"),
      kicker: t("myspace.tip.mail.kicker"),
      list: (close) => (
        <TipPreviewList
          kind="mail"
          items={unreadMail}
          label={(m) => m.from || "—"}
          value={(m) => m.subject || t("calendar.noSubject")}
          valueLang={null}
          onOpen={openWith(close, "mail")}
        />
      ),
      note: t("myspace.tip.mail.note"),
      action: { label: t("myspace.tip.mail.open"), onClick: () => requestPanel("mail") },
    },
    overdue: {
      title: t("widgets.brief.tip.overdue"),
      kicker: t("myspace.tasks.title"),
      list: taskList(tasks.filter((x) => !x.done && x.overdue)),
      action: todoAction,
    },
    tasks: {
      title: t("myspace.tip.tasks.title"),
      kicker: t("myspace.tasks.title"),
      list: taskList(tasks.filter((x) => !x.done && !x.overdue)),
      action: todoAction,
    },
    // Ticket (yalnız kitlede): sayılar listenin son okumasından; ayrıntı Self Servis › Ticket'ta.
    tibot: {
      title: t("widgets.brief.item.tibot"),
      kicker: "Ticket",
      list: ticketList("onMe"),
      // Sıfır yan cümle yazılmaz ("0 tanesinin hedefi geçti" bilgi değil, gürültü).
      note: tibot?.late
        ? t("widgets.brief.tibotNote", { n: tibot.assigned, late: tibot.late })
        : t("widgets.brief.tibotNoteOnly", { n: tibot?.assigned ?? 0 }),
      action: { label: t("widgets.brief.act.tibot"), to: TIBOT_PATH },
    },
    tibotWaiting: {
      title: t("widgets.brief.item.tibotWaiting"),
      kicker: "Ticket",
      list: ticketList("waiting"),
      note: tibot?.needsMe
        ? t("widgets.brief.tibotWaitingNote", { n: tibot.waiting, needs: tibot.needsMe })
        : t("widgets.brief.tibotWaitingNoteOnly", { n: tibot?.waiting ?? 0 }),
      action: { label: t("widgets.brief.act.tibot"), to: TIBOT_PATH },
    },
    feed: {
      title: t("myspace.tip.posts.title"),
      kicker: t("nav.feed"),
      list: (close) => (
        <TipPreviewList
          kind="post"
          items={feedItems.map((p) => ({
            ...p,
            openTo: `/feed?${new URLSearchParams({ post: p.id })}`,
          }))}
          label={(p) => t(`feed.tag.${p.tag}`)}
          value={(p) => p.subject || t("calendar.noSubject")}
          labelClass="w-[5.5rem]"
          onOpen={openWith(close, "post")}
        />
      ),
      note: t("myspace.tip.posts.note"),
      action: { label: t("myspace.tip.posts.open"), to: "/feed" },
    },
  }

  const meetingsTip = (list, title) => ({
    title,
    kicker: t("myspace.tip.meetings.kicker"),
    list: (close) => (
      <MeetingList
        meetings={list}
        timeFmt={getDateTimeFormat(locale, OPTS_TIME)}
        onOpen={openWith(close, "event")}
      />
    ),
    note: t("myspace.tip.meetings.note"),
    action: { label: t("myspace.tip.meetings.open"), onClick: () => requestPanel("calendar") },
  })

  return {
    tips: TIP,
    meetingsTip,
    dialog: (
      <>
        <PreviewDialog preview={preview} onClose={() => setPreview(null)} />
        <TicketSheetLazy row={ticket} onClose={() => setTicket(null)} />
      </>
    ),
  }
}

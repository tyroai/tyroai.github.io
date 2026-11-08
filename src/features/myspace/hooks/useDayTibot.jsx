import { useEffect, useState } from "react"
import { TicketTipListLazy } from "@/components/tibot/TicketLazy"
import { InsightTerm } from "@/features/myspace/InsightTerm"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useTibotPeek } from "@/lib/tibot/tibotPeek"
import { TIBOT_PATH } from "@/lib/tibotPolicy"

/**
 * Günün özeti'nin Tibot'u (yalnız kitlede, `pageAccess.tibot`): sayılar listenin son okumasından
 * (`tibotPeek`); okunmadıysa bir kez okunur (ayrı parçadan). `ticket`: ipucundan açılan talep.
 */
export function useDayTibot() {
  const allowed = usePageAccess().tibot
  const peek = useTibotPeek()
  const [ticket, setTicket] = useState(null)
  useEffect(() => {
    if (!allowed) return
    import("@/lib/tibot/tibotApi").then((m) => m.loadTickets()).catch(() => {})
  }, [allowed])
  return { peek: allowed ? peek : null, ticket, setTicket }
}

/**
 * Özetin TEK Tibot maddesi (`{ key, tone, node }` ya da hiç): sana atanan varsa "Tibot'ta seni
 * bekleyen 23 talep" (geciken varsa vurgu kırmızıya yakın tonda; açtıkların ipucunun notunda),
 * yoksa "Açtığın ve süren 1 talep". Tek madde: panodaki kart sabit boyda, her satır yer yer.
 * Vurgulu ifade öteki maddeler gibi bir kapı: ipucunda ilk üç talep (basınca pencere), dipte
 * "Tibot'a git". `t`, `phrase`, `fill`: özetin kendi yardımcıları (çoğul ve yuva).
 */
export function dayTibotItems({ day, t, phrase, fill }) {
  const peek = day.peek
  if (!peek || (!peek.assigned && !peek.waiting)) return []
  const onMe = peek.assigned > 0
  const tone = onMe ? (peek.late > 0 ? "to" : "via") : "from"
  const open = (close) => (row) => {
    close()
    requestAnimationFrame(() => day.setTicket(row))
  }
  const notes = onMe
    ? [
        peek.late > 0 && t("myspace.tip.tibot.note", { late: peek.late }),
        peek.waiting > 0 && t("myspace.tip.tibot.alsoWaiting", { n: peek.waiting }),
      ]
    : [peek.needsMe > 0 && t("myspace.tip.tibotWaiting.note", { n: peek.needsMe })]
  const note = notes.filter(Boolean).join(" · ") || undefined
  return [
    {
      key: "tibot",
      tone,
      node: fill(
        t(onMe ? "myspace.sum.tibot" : "myspace.sum.tibotWaiting"),
        <InsightTerm
          tone={tone}
          title={t(onMe ? "myspace.tip.tibot.title" : "myspace.tip.tibotWaiting.title")}
          kicker="Tibot"
          list={(close) => (
            <TicketTipListLazy kind={onMe ? "onMe" : "waiting"} onOpen={open(close)} />
          )}
          note={note}
          action={{ label: t("myspace.tip.tibot.open"), to: TIBOT_PATH }}
        >
          {phrase("tibot", onMe ? peek.assigned : peek.waiting)}
        </InsightTerm>,
      ),
    },
  ]
}

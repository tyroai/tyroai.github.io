import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { createFocusBlock, deleteFocusBlock } from "@/lib/focusWindow"
import { STATUS } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { planAgenda } from "@/lib/planAgenda"
import { planQuestion } from "@/lib/planQuestion"
import { localDayKey } from "@/lib/todo"
import { timeFormat } from "../dayInsightText"

const OFFICE = "tyroOffice"

/**
 * Günün okumasının tek dokunuşluk eylemi. Odak bloğu Odak penceresi widget'ıyla aynı yazma
 * (`createFocusBlock`, meşgul + özel); bildirimde "Geri al" bloğu siler. Gün planı küre
 * kartıyla aynı soru (`planAgenda` + `planQuestion`) — TYRO'ya gerçek gündemle gider.
 */
export function useInsightAction({ action, events, tasks, now, onChanged }) {
  const { t, locale } = useLocale()
  const { instance, accounts } = useMsal()
  const navigate = useNavigate()
  const [state, setState] = useState("idle") // idle · busy · done

  async function focus() {
    setState("busy")
    const res = await createFocusBlock(instance, accounts[0], {
      start: action.start,
      end: action.end,
      subject: t("widgets.focusWindow.subject"),
    })
    if (res.status !== STATUS.ready) {
      setState("idle")
      notify.error(t("widgets.focusWindow.failed"))
      return
    }
    setState("done")
    onChanged?.()
    const id = res.data?.id
    const time = timeFormat(locale)
    notify.success(
      t("widgets.focusWindow.done", {
        time: `${time.format(action.start)}–${time.format(action.end)}`,
      }),
      id ? { action: { label: t("insight.act.undo"), onClick: () => undo(id) } } : undefined,
    )
  }

  async function undo(id) {
    const res = await deleteFocusBlock(instance, accounts[0], id)
    if (res.status === STATUS.ready) {
      setState("idle")
      notify.success(t("insight.act.undone"))
      onChanged?.()
    } else notify.error(t("insight.act.undoFailed"))
  }

  function plan() {
    const agenda = planAgenda("today", { events: events ?? [], tasks: tasks ?? [], now })
    setPendingAsk({ question: planQuestion("today", agenda, t, locale), agent: OFFICE })
    requestOpenChat({ focusComposer: true })
  }

  /** `close`: ipucu kapanır, iş sonra koşar (açılan panel odağı alsın). */
  function run(close) {
    if (!action || state !== "idle") return
    if (action.kind === "focus") return void focus()
    close()
    requestAnimationFrame(() => {
      if (action.kind === "plan") plan()
      else navigate(`/self-service?new=leave&day=${localDayKey(action.day)}`)
    })
  }

  return { state, run }
}

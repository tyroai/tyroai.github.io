import { useCallback, useSyncExternalStore } from "react"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { STATUS, graphPostNoContent, requestGraphScopes } from "@/lib/graph"
import { MAIL_SEND_SCOPES } from "@/lib/mailSend"
import { notify } from "@/lib/notify"
import { LATE_UNDO_MS, lateMail, lateMessage } from "@/lib/runningLate"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * "Geç kalıyorum"un durumu, toplantı başına: `idle` · `waiting` (8 sn geri alma ya da gönderim
 * sürüyor) · `sent`. Bekleyen gönderim modülde durur: pencere ya da kart kapansa da gider; "Geri
 * al" bildirimin düğmesinde. Kayıt yalnız bellekte ve çıkışta silinir (`clearRunningLate`,
 * `lib/sessionCache`). Kurallar ve postanın metni `lib/runningLate`.
 */
const timers = new Map() // toplantı → bekleyen gönderim
const busy = new Set() // gönderimi süren toplantılar
const sent = new Map() // toplantı → dakika
const listeners = new Set()
let version = 0

function emit() {
  version += 1
  listeners.forEach((fn) => fn())
}
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const snapshot = () => version

export function clearRunningLate() {
  timers.forEach(clearTimeout)
  timers.clear()
  busy.clear()
  sent.clear()
  emit()
}
onSessionClear(clearRunningLate)

async function deliver(instance, account, event, message) {
  const res = await graphPostNoContent(instance, account, {
    path: "/me/sendMail",
    scopes: MAIL_SEND_SCOPES,
    body: lateMail(event, message),
  })
  return res.status === STATUS.ready ? "ok" : res.status === STATUS.denied ? "denied" : "error"
}

export function useRunningLate(event) {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  useSyncExternalStore(subscribe, snapshot, snapshot)
  const id = event?.id ?? null
  const state = !id
    ? "idle"
    : sent.has(id)
      ? "sent"
      : timers.has(id) || busy.has(id)
        ? "waiting"
        : "idle"

  const choose = useCallback(
    (minutes) => {
      if (!id || timers.has(id) || busy.has(id) || sent.has(id)) return
      const account = accounts[0]
      const message = lateMessage(event, minutes, t)
      const toast = `late-${id}`
      const send = async () => {
        busy.add(id)
        emit()
        const result = await deliver(instance, account, event, message)
        busy.delete(id)
        if (result === "ok") sent.set(id, minutes)
        emit()
        if (result === "ok") {
          notify.success(t("calendar.late.sent"), { id: toast, description: message.body })
          return
        }
        // İzin onayı açılır pencere ister: ancak kişinin bastığı düğmeden (bildirimdeki).
        notify.error(t("calendar.late.failed"), {
          id: toast,
          action: {
            label: t(result === "denied" ? "calendar.late.allow" : "calendar.late.retry"),
            onClick: async () => {
              if (
                result === "denied" &&
                !(await requestGraphScopes(instance, account, MAIL_SEND_SCOPES))
              )
                return
              send()
            },
          },
        })
      }
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id)
          send()
        }, LATE_UNDO_MS),
      )
      emit()
      notify.info(t("calendar.late.sending", { name: event.organizer || event.organizerAddress }), {
        id: toast,
        description: message.body,
        duration: LATE_UNDO_MS,
        action: {
          label: t("calendar.late.undo"),
          onClick: () => {
            // Süre dolduysa gönderim başladı: geri alınamaz.
            if (!timers.has(id)) return
            clearTimeout(timers.get(id))
            timers.delete(id)
            emit()
            notify.info(t("calendar.late.cancelled"), { id: toast })
          },
        },
      })
    },
    [id, event, t, instance, accounts],
  )

  return { state, minutes: id ? (sent.get(id) ?? null) : null, choose }
}

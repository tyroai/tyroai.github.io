import { useCallback, useEffect, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { STATUS, requestGraphScopes } from "@/lib/graph"
import {
  PRESENCE_SCOPES,
  clearPresence,
  needsConsent,
  readPresence,
  setPresence,
  withConsent,
} from "./graphTools"
import { focusLinks } from "./focusLinkStore"
import { readChoice, writeChoice } from "./presenceChoiceStore"
import { presenceMinutes, presenceSource } from "./presenceModel"

const EMPTY = { status: "loading", availability: null, activity: null, source: null }
const SETTLE_MS = 5000

// Kaynak okunduğu anda kurulur (render saf kalsın): TYRO'nun izi ve Odak bağı o anki haliyle.
function ready(availability, activity) {
  const applied = focusLinks().applied
  const source = presenceSource({
    availability,
    activity,
    mine: readChoice(),
    focus: applied?.presence ? { until: applied.until } : null,
    now: Date.now(),
  })
  return { status: "ready", availability, activity, source }
}

const stateOf = (res) =>
  res.status === STATUS.ready
    ? ready(res.data?.availability, res.data?.activity)
    : {
        status: needsConsent(res) ? "consent" : "error",
        availability: null,
        activity: null,
        source: null,
      }

/**
 * Teams durumunun kancası: kurulunca bir kez okur (yoklama yok: panel açıkken yeterli). İzin yoksa
 * `consent`; `connect` izni kişinin dokunuşuyla ister. Seçilen durum hemen gösterilir (Graph'ın
 * okuması birkaç saniye geriden gelir). `source`: durumu şu an kim koyuyor (`presenceSource`).
 */
export function usePresence() {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  const [state, setState] = useState(EMPTY)

  const load = useCallback(async () => {
    const res = await readPresence(instance, account)
    setState(stateOf(res))
  }, [instance, account])

  useEffect(() => {
    let alive = true
    readPresence(instance, account).then((res) => {
      if (alive) setState(stateOf(res))
    })
    return () => {
      alive = false
    }
  }, [instance, account])

  const connect = async () => {
    if (await requestGraphScopes(instance, account, PRESENCE_SCOPES)) await load()
  }

  const choose = async (choice, duration, until) => {
    const minutes = presenceMinutes(duration, Date.now(), until)
    const res = await withConsent(instance, account, PRESENCE_SCOPES, () =>
      setPresence(instance, account, choice, minutes),
    )
    if (res.status === STATUS.ready) {
      writeChoice({ choice, until: Date.now() + minutes * 60_000 })
      setState(ready(choice, choice))
    }
    return res
  }

  // Teams'e bırakınca Graph'ın okuması birkaç saniye eski tercihi döndürür: kaynak hemen "Teams"
  // gösterilir, gerçek durum bir kez biraz sonra okunur (yoklama değil).
  const settle = useRef(0)
  useEffect(() => () => clearTimeout(settle.current), [])

  const reset = async () => {
    const res = await withConsent(instance, account, PRESENCE_SCOPES, () =>
      clearPresence(instance, account),
    )
    if (res.status === STATUS.ready) {
      writeChoice(null)
      setState((s) => (s.status === "ready" ? { ...s, source: { by: "teams", reason: null } } : s))
      clearTimeout(settle.current)
      settle.current = setTimeout(load, SETTLE_MS)
    }
    return res
  }

  return { ...state, connect, choose, reset }
}

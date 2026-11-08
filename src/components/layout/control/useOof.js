import { useCallback, useEffect, useMemo, useReducer, useState, useSyncExternalStore } from "react"
import { useMsal } from "@azure/msal-react"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { usePageAccess } from "@/hooks/usePageAccess"
import { writeBellNotice } from "@/lib/bellSeen"
import { STATUS } from "@/lib/graph"
import { createSessionCache } from "@/lib/sessionCache"
import { OOF_SCOPES, needsConsent, readOof, saveOof, withConsent } from "./graphTools"
import {
  noticeKey,
  parseOofAsk,
  readOofAskRaw,
  rememberOurs,
  skipKey,
  skipLeave,
  subscribeOofAsk,
  windowKey,
} from "./oofAsk"
import { loadApprovedLeaves } from "./oofLeaves"
import { leaveKey, mergeLeaves, oofAsk, oofState, oofWindow } from "./oofModel"

const NONE = []
// Bir kanca yazınca açık olan ötekiler (kutucuk, şerit, çan) ayarı yeniden okur.
const CHANGED = "tyro:oof-changed"
const none = () => null

// Kutucuk, şerit ve bildirim aynı anda okur: tek istek (30 sn), çıkışta silinir.
const reads = createSessionCache({ ttlMs: 30_000, maxEntries: 1, name: "oofSetting" })

function readShared(instance, account) {
  const key = account?.homeAccountId ?? "-"
  if (reads.has(key)) return Promise.resolve(reads.get(key))
  return reads.dedupe(key, (commit) =>
    readOof(instance, account).then((res) => {
      commit(res)
      return res
    }),
  )
}

/** İzin onaylı izinlerden biri mi (tarihleri değiştirilmemiş): yanıtı TYRO kurmuş sayılır. */
const approved = (spans, leave) =>
  Array.isArray(spans) && mergeLeaves(spans).some((s) => leaveKey(s) === leaveKey(leave))

/**
 * Otomatik yanıtın kancası: Outlook'taki ayar (sessiz okuma; izin yoksa `consent`) ve onaylı
 * izinler (Self Servis erişimi olana), ikisinden sorulacak soru (`oofAsk`). Soru yalnız ikisi de
 * bilinince sorulur — ayar okunamadıysa ya da izinler gelmediyse sorulmaz — ve çana yazılır
 * (`writeBellNotice`). Yazma kişinin bastığı düğmeden: izin gerekiyorsa o an istenir
 * (`withConsent`), sonra ayar yeniden okunur ve açık kancalara duyurulur.
 *
 * `settled`: okumalar bitti (sonuç ne olursa olsun) — günlük soru bir kez denensin.
 */
export function useOof({ enabled = true } = {}) {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  const { selfService } = usePageAccess()
  const now = useMinuteNow().getTime()
  const [oof, setOof] = useState({ status: "loading", setting: null })
  // undefined: okunuyor · null: okunamadı · dizi: onaylı izinler.
  const [leaves, setLeaves] = useState(undefined)
  const [version, reread] = useReducer((n) => n + 1, 0)
  const raw = useSyncExternalStore(subscribeOofAsk, readOofAskRaw, none)
  const marks = useMemo(() => parseOofAsk(raw), [raw])

  const apply = useCallback((res) => {
    if (res.status === STATUS.ready) setOof({ status: "ready", setting: res.data })
    else setOof({ status: needsConsent(res) ? "consent" : "error", setting: null })
  }, [])

  useEffect(() => {
    window.addEventListener(CHANGED, reread)
    return () => window.removeEventListener(CHANGED, reread)
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    let alive = true
    readShared(instance, account).then((res) => alive && apply(res))
    return () => {
      alive = false
    }
  }, [enabled, instance, account, apply, version])

  useEffect(() => {
    if (!enabled || !selfService) return undefined
    let alive = true
    loadApprovedLeaves(account).then((spans) => alive && setLeaves(spans))
    return () => {
      alive = false
    }
  }, [enabled, selfService, account])

  const spans = selfService ? leaves : NONE
  const state = useMemo(() => (oof.setting ? oofState(oof.setting, now) : null), [oof.setting, now])
  const known = (oof.status === "ready" || oof.status === "consent") && Array.isArray(spans)
  const ask = useMemo(() => {
    if (!known) return null
    const skip = new Set(marks.skip)
    const ours = new Set(marks.ours)
    return oofAsk(spans, state, now, {
      skipped: (leave) => skip.has(skipKey(leave)),
      ours: (s) => ours.has(windowKey(s)),
    })
  }, [known, spans, state, now, marks])

  // Çanın bekleyen sorusu: soru bilinince yazılır (yalnız anahtarı değişince); okuma hatası
  // eskisini silmez.
  const notice = known ? (ask ? noticeKey(ask, state) : "") : null
  useEffect(() => {
    if (notice !== null) writeBellNotice(notice)
  }, [notice])

  const save = useCallback(
    async (args) => {
      const res = await withConsent(instance, account, OOF_SCOPES, () =>
        saveOof(instance, account, args),
      )
      if (res.status === STATUS.ready) {
        reads.clear()
        apply(await readShared(instance, account))
        window.dispatchEvent(new Event(CHANGED))
      }
      return res
    },
    [instance, account, apply],
  )

  return {
    status: oof.status,
    state,
    audience: oof.setting?.audience ?? "all",
    spans: spans ?? null,
    ask,
    settled: oof.status !== "loading" && spans !== undefined,
    schedule: async (leave, texts) => {
      const w = oofWindow(leave)
      const res = await save({ status: "scheduled", start: w.start, end: w.end, ...texts })
      // Onaylı izinden kurulan yanıt TYRO'nun: izin iptal olursa kaldırmayı yalnız onun için sorar.
      if (res.status === STATUS.ready && approved(spans, leave)) rememberOurs(w)
      return res
    },
    turnOn: (texts) => save({ status: "alwaysEnabled", ...texts }),
    turnOff: () => save({ status: "disabled" }),
    skip: skipLeave,
  }
}

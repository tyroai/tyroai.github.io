import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { STATUS, requestGraphScopes } from "@/lib/graph"
import { isMsalConfigured } from "@/lib/msal"
import { notify } from "@/lib/notify"
import { TODO_SCOPES } from "@/lib/todo"
import { failToast } from "@/lib/todoToast"
import { addStep as postStep, createBoardTask, updateBoardTask, updateStep } from "@/lib/todoBoard"
import { toMilestone } from "@/lib/horizon"
import { notifyTodoChanged } from "@/lib/todoSync"
import {
  dropMilestone,
  horizonSnapshot,
  insertMilestone,
  loadHorizon,
  patchMilestone,
  setHorizonSettings,
  subscribeHorizon,
} from "./horizonStore"

const NONE = []
const UNDO_MS = 6000
let tempSeq = 0

/**
 * Ufukta'nın verisi ve işleri. Değişiklikler iyimser: kart hemen değişir, To Do reddederse geri
 * alınır ve söylenir. Bitirilen hedef bu oturumda yerinde kalır (üstü çizili, "Geri al"lı).
 */
export function useHorizon() {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const account = isMsalConfigured ? (accounts[0] ?? null) : null
  const who = account?.homeAccountId ?? null
  const { settings, data } = useSyncExternalStore(
    subscribeHorizon,
    horizonSnapshot,
    horizonSnapshot,
  )
  const wanted = `${settings.lists.join(",")}|${settings.done}`

  useEffect(() => {
    if (account) loadHorizon(instance, account)
    // `wanted`: liste seçimi değişince yalnız eksik liste sorulur.
  }, [instance, account, wanted])

  // Sekmeye dönüşte bayatsa tazele (Outlook'ta ya da telefonda eklenen hedef gelsin).
  useEffect(() => {
    if (!account) return undefined
    const onVisible = () => {
      if (!document.hidden) loadHorizon(instance, account)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [instance, account])

  const mine = data.account === who
  const lists = (mine && data.lists) || NONE
  const selected = useMemo(
    () => lists.filter((l) => settings.lists.includes(l.id)),
    [lists, settings.lists],
  )
  const items = useMemo(
    () => (mine ? selected.flatMap((l) => data.byList[l.id]?.tasks ?? NONE) : NONE),
    [mine, selected, data.byList],
  )
  const skipped = mine ? selected.filter((l) => data.byList[l.id]?.failed).length : 0
  const status = !account
    ? STATUS.unauthenticated
    : !mine || data.status === "idle"
      ? "loading"
      : data.status

  const fail = useCallback((res) => failToast(t, res, "myspace.todo.saveFailed"), [t])

  // To Do'da silinmiş listenin kimliği ayarda yer tutmasın (en çok 6 liste).
  const toggleList = useCallback(
    (id) => {
      const live = settings.lists.filter((x) => lists.some((l) => l.id === x))
      setHorizonSettings({
        lists: live.includes(id) ? live.filter((x) => x !== id) : [...live, id],
      })
    },
    [settings.lists, lists],
  )

  const setShowDone = useCallback((done) => setHorizonSettings({ done }), [])

  const setDone = useCallback(
    (item, done) => {
      if (!account || item.pending) return
      // `justDone`: bu oturumda bitirilen hedef kartta kalır (üstü çizili), "Geri al" görünür olsun.
      const mark = (value) => (x) => ({ ...x, done: value, justDone: value })
      const save = (value, announce) => {
        patchMilestone(item.listId, item.id, mark(value))
        updateBoardTask(instance, account, {
          listId: item.listId,
          taskId: item.id,
          changes: { done: value },
        }).then((res) => {
          if (res.status !== STATUS.ready) {
            patchMilestone(item.listId, item.id, mark(!value))
            fail(res)
            return
          }
          notifyTodoChanged("horizon")
          if (!announce) return
          notify.success(t("widgets.horizon.doneToast", { name: item.title }), {
            duration: UNDO_MS,
            action: { label: t("widgets.undo"), onClick: () => save(false, false) },
          })
        })
      }
      save(done, done)
    },
    [instance, account, fail, t],
  )

  const toggleStep = useCallback(
    (item, step) => {
      if (!account || item.pending) return
      const flip = (x) => ({
        ...x,
        steps: x.steps?.map((s) => (s.id === step.id ? { ...s, done: !step.done } : s)),
      })
      patchMilestone(item.listId, item.id, flip)
      updateStep(instance, account, {
        listId: item.listId,
        taskId: item.id,
        stepId: step.id,
        changes: { done: !step.done },
      }).then((res) => {
        if (res.status === STATUS.ready) return notifyTodoChanged("horizon")
        patchMilestone(item.listId, item.id, flip)
        fail(res)
      })
    },
    [instance, account, fail],
  )

  // Adım ekle: iyimser (hemen listede, beklerken işaretlenemez); To Do reddederse kalkar, söylenir.
  const addStep = useCallback(
    (item, title) => {
      const clean = String(title ?? "").trim()
      if (!account || item.pending || !clean) return false
      const temp = { id: `tmp-${++tempSeq}`, title: clean, done: false, pending: true }
      patchMilestone(item.listId, item.id, (x) => ({ ...x, steps: [...(x.steps ?? []), temp] }))
      postStep(instance, account, { listId: item.listId, taskId: item.id, title: clean }).then(
        (res) => {
          const made = res.status === STATUS.ready ? res.step : null
          patchMilestone(item.listId, item.id, (x) => ({
            ...x,
            steps: (x.steps ?? []).flatMap((s) => (s.id !== temp.id ? [s] : made ? [made] : [])),
          }))
          if (!made) return fail(res)
          notifyTodoChanged("horizon")
        },
      )
      return true
    },
    [instance, account, fail],
  )

  const add = useCallback(
    ({ title, dueKey, listId }) => {
      const list = lists.find((l) => l.id === listId)
      const clean = String(title ?? "").trim()
      if (!account || !list || !clean || !dueKey) return false
      const temp = {
        id: `tmp-${++tempSeq}`,
        listId,
        listName: list.name,
        title: clean,
        dueKey,
        done: false,
        note: "",
        steps: [],
        pending: true,
      }
      insertMilestone(listId, temp)
      createBoardTask(instance, account, { listId, title: clean, dueKey }).then((res) => {
        dropMilestone(listId, temp.id)
        const made = res.status === STATUS.ready ? toMilestone(res.task, list.name) : null
        if (!made) return fail(res)
        insertMilestone(listId, made)
        notifyTodoChanged("horizon")
      })
      return true
    },
    [instance, account, lists, fail],
  )

  const connect = useCallback(async () => {
    const ok = await requestGraphScopes(instance, account, TODO_SCOPES)
    if (ok) loadHorizon(instance, account, { force: true })
    else failToast(t, null, "myspace.todo.connectFailed")
  }, [instance, account, t])

  const retry = useCallback(() => {
    if (account) loadHorizon(instance, account, { force: true })
  }, [instance, account])

  return {
    status,
    detail: mine ? data.detail : "",
    settings,
    lists,
    selected,
    items,
    skipped,
    toggleList,
    setShowDone,
    setDone,
    toggleStep,
    addStep,
    add,
    connect,
    retry,
  }
}

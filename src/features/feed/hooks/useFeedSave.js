import { useCallback, useState, useSyncExternalStore } from "react"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { causeText, withCause } from "@/lib/causeText"
import { savedRecordOf, savedStore } from "@/features/feed/lib/feedReactions"
import { removeTask, saveTask } from "@/features/feed/lib/feedSave"
import { getSnapshot, setHandoff, subscribe } from "@/features/feed/lib/forYouSession"
import { STATUS, requestGraphScopes } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { TODO_SCOPES } from "@/lib/todo"

/** Yolda olan istekler (gönderi kimliği): kart ve okuma bölmesi aynı postayı iki kez kaydetmesin. */
const inflight = new Set()

/**
 * "KAYDET" — gönderi Microsoft To Do'ya "sonra oku" görevi olur; dolu yer imi = görev var.
 * İyimser: yer imi hemen dolar ya da boşalır, Graph reddederse eski hâline döner ve
 * söylenir. Bildirimdeki "Geri al" son adımı tersine çevirir; iş modül düzeyinde olduğu
 * için okuma bölmesi kapanmış olsa da çalışır.
 *
 * Sana özel'in "To-Do'ya ekle"siyle aynı postaya iki görev açılmasın diye oturum kaydı
 * (`features/feed/lib/forYouSession.js`) iki yönde de kullanılır: orada eklenen burada dolu görünür,
 * burada kaydedilen orada "eklendi" olur.
 */
export function useFeedSave(post) {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const { items } = useSyncExternalStore(
    savedStore.subscribe,
    savedStore.getSnapshot,
    savedStore.getSnapshot,
  )
  const session = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [pending, setPending] = useState(null)
  const homeKey = account?.homeAccountId ?? null
  const handed = homeKey && session.key === homeKey ? session.todo.get(post.id) : null
  const record = savedRecordOf(items, post, handed)
  const saved = pending ? pending === "save" : Boolean(record)
  // Sana özel aynı postayı o an To Do'ya ekliyorsa beklenir: ikinci görev açılmasın.
  const busy = Boolean(pending) || handed?.state === "busy"

  const toggle = useCallback(() => {
    if (busy || inflight.has(post.id)) return
    const ctx = { instance, account, t, setPending }
    if (record) remove(ctx, post, record)
    else save(ctx, post)
  }, [busy, record, post, instance, account, t])

  return { saved, busy, toggle }
}

/** Sana özel'in oturum kaydına yansıt (`null` kaydı siler). */
function mirror(account, post, entry) {
  if (account?.homeAccountId) setHandoff(account.homeAccountId, post.id, entry)
}

async function save(ctx, post) {
  const { instance, account, t, setPending } = ctx
  inflight.add(post.id)
  setPending("save")
  mirror(account, post, { state: "busy" })
  const res = await saveTask(instance, account, {
    title: post.subject || t("feed.noSubject"),
    note: t("feed.actions.saveNote", { author: post.author }),
    webUrl: post.webLink,
  })
  inflight.delete(post.id)
  setPending(null)
  // Kaydetme ve kaldırma bildirimleri ayrı kimlikte: "Geri al" kendi bildirimini kapatırken
  // sonucu yeni bir bildirimle söyler (aynı kimlik kapanan bildirimin içinde kaybolurdu).
  const id = `feed-save-${post.id}`
  if (res.status === STATUS.ready) {
    const record = { taskId: res.taskId, listId: res.listId }
    savedStore.set(post, record)
    mirror(account, post, { state: "done", ...record, listName: res.listName })
    notify.success(t("feed.actions.savedTitle"), {
      id,
      description: t("feed.actions.savedBody", { list: res.listName || t("nav.todo") }),
      action: { label: t("feed.actions.undo"), onClick: () => remove(ctx, post, record, true) },
    })
    return
  }
  mirror(account, post, null)
  if (res.status === STATUS.denied) {
    notify.error(t("feed.actions.saveDenied"), {
      id,
      description: withCause(t("feed.actions.saveDeniedBody"), causeText(t, res.detail)),
      action: {
        label: t("todo.connect"),
        onClick: async () => {
          if (await requestGraphScopes(instance, account, TODO_SCOPES)) save(ctx, post)
        },
      },
    })
  } else {
    notify.error(t("feed.actions.saveFailed"), {
      id,
      description: withCause(t("feed.actions.saveFailedBody"), causeText(t, res.detail)),
    })
  }
}

/** `undo`: kaydetmenin hemen geri alınması — bildirim tekrar "Geri al" önermez. */
async function remove(ctx, post, record, undo = false) {
  const { instance, account, t, setPending } = ctx
  inflight.add(post.id)
  setPending("remove")
  const res = await removeTask(instance, account, record)
  inflight.delete(post.id)
  setPending(null)
  const id = `feed-unsave-${post.id}`
  if (res.status !== STATUS.ready) {
    notify.error(t("feed.actions.unsaveFailed"), {
      id,
      description: withCause(t("feed.actions.saveFailedBody"), causeText(t, res.detail)),
    })
    return
  }
  savedStore.remove(post)
  mirror(account, post, null)
  if (undo) {
    notify.info(t("feed.actions.undone"), { id, description: t("feed.actions.unsavedBody") })
    return
  }
  notify.info(t("feed.actions.unsavedTitle"), {
    id,
    description: t("feed.actions.unsavedBody"),
    action: { label: t("feed.actions.undo"), onClick: () => save(ctx, post) },
  })
}

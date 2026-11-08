import { useCallback, useEffect, useMemo, useState } from "react"
import { notify } from "@/lib/notify"
import { readDevAuthBypass } from "@/lib/devAuth"
import { computePlan } from "@/lib/rm/engine/compute"
import { planOf } from "@/features/rm/lib/importPlan"
import { applyTeamAliases } from "@/features/rm/lib/teamAliases"
import {
  checkPlan,
  createPlan,
  createSnapshot,
  readDoc,
  readPlan,
  writePlan,
} from "@/features/rm/lib/docStore"
import { getRmEntry, setRmEntry, subscribeRm } from "@/lib/rm/rmCache"
import { stamp } from "@/features/rm/lib/format"
import { isNewer } from "@/features/rm/lib/version"
import { useRmText } from "./useRmText"

// Geliştirmede (`?devauth=1`) Dataverse yok: anonim test planı okunur. Üretimde blok ölü kod.
async function sourceEntry() {
  if (import.meta.env.DEV && readDevAuthBypass()) {
    const mod = await import("../../../../tests/fixtures/rm/plan-anon.json")
    return {
      meta: { id: "dev", etag: null, modifiedOn: new Date().toISOString(), modifiedBy: "Dev" },
      doc: { format: "tyrorm", v: 1, source: { name: "plan-anon.json" }, plan: mod.default },
    }
  }
  return readPlan()
}

let inflight = null
function fetchEntry() {
  inflight ??= sourceEntry()
    .then((e) => {
      setRmEntry(e ?? { meta: null, doc: null })
      return e
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/**
 * Bölümün verisi: Dataverse'teki plan, hesaplanmış hâli ve kayıt işlemleri. Yoklama yok:
 * bölüme girişte okunur, sayfa geçişinde `checkFresh` ucuz bir "değişti mi?" sorar (304).
 */
export function useRmData() {
  const { rt, locale } = useRmText()
  const [entry, setEntry] = useState(getRmEntry)
  const [status, setStatus] = useState(() => (getRmEntry() ? "ready" : "loading"))
  const [error, setError] = useState(null)

  useEffect(() => subscribeRm(setEntry), [])

  const load = useCallback(async () => {
    setStatus((s) => (s === "ready" ? "refreshing" : "loading"))
    setError(null)
    try {
      await fetchEntry()
      setStatus("ready")
    } catch (err) {
      setError(err)
      setStatus(getRmEntry() ? "ready" : "error")
    }
  }, [])

  // Bölüme ilk girişte bir kez; sonraki geçişler bellekteki kopyayı kullanır.
  useEffect(() => {
    if (getRmEntry()) return undefined
    let alive = true
    fetchEntry()
      .then(() => alive && setStatus("ready"))
      .catch((err) => {
        if (!alive) return
        setError(err)
        setStatus("error")
      })
    return () => {
      alive = false
    }
  }, [])

  const meta = entry?.meta ?? null
  const doc = entry?.doc ?? null
  const raw = useMemo(() => planOf(doc), [doc])
  const st = useMemo(() => applyTeamAliases(raw), [raw])
  const plan = useMemo(() => (st ? computePlan(st) : null), [st])

  /**
   * Başkası kaydetti mi? Yalnız etiketi sorar; gerçekten yeni sürüm varsa ekran kendiliğinden
   * en son plana geçer ve kısa bir bildirim çıkar (bekleyen şerit yok).
   */
  const checkFresh = useCallback(async () => {
    const m = getRmEntry()?.meta
    if (!m?.id || m.id === "dev" || !m.etag) return
    try {
      const r = await checkPlan(m.id, m.etag)
      if (r.fresh || !isNewer(r.meta, getRmEntry()?.meta)) return
      await fetchEntry()
      notify.info(rt("rm.notice.updated"), {
        description: rt("rm.notice.updatedBy", {
          who: r.meta.modifiedBy || "—",
          time: stamp(r.meta.modifiedOn, locale),
        }),
      })
    } catch {
      // Sessiz: tazelik sorusu başarısızsa ekrandaki veri olduğu gibi kalır.
    }
  }, [rt, locale])

  /** İçe aktarma: önce mevcut planın anlık görüntüsü, sonra sürüm etiketli yazma. */
  const replacePlan = useCallback(async (nextDoc, note) => {
    const cur = getRmEntry()
    if (cur?.meta?.id === "dev") {
      setRmEntry({ meta: { ...cur.meta, modifiedOn: new Date().toISOString() }, doc: nextDoc })
      return
    }
    if (cur?.doc && cur.meta?.id) await createSnapshot(cur.doc, note)
    const m = cur?.meta?.id
      ? await writePlan(cur.meta.id, cur.meta.etag, nextDoc)
      : await createPlan(nextDoc)
    setRmEntry({ meta: m, doc: nextDoc })
  }, [])

  /** Anlık görüntüye dönüş: şimdiki hâl de önce saklanır. */
  const restoreSnapshot = useCallback(
    async (id, note) => {
      const snap = await readDoc(id)
      if (!snap.doc) throw new Error("empty snapshot")
      await replacePlan(snap.doc, note)
    },
    [replacePlan],
  )

  return {
    status,
    error,
    meta,
    doc,
    raw,
    st,
    plan,
    reload: load,
    checkFresh,
    replacePlan,
    restoreSnapshot,
  }
}

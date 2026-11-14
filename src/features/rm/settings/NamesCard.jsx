import { useMemo, useState, useSyncExternalStore } from "react"
import UserEdit01Icon from "@hugeicons/core-free-icons/UserEdit01Icon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { Button } from "@/components/ui/button"
import { migrateNames, namePairs } from "@/features/rm/lib/edit/people"
import { peopleState, subscribePeople } from "@/features/rm/lib/peopleDirectory"
import { useRmEdit } from "../data/useRmEdit"
import { useRmText } from "../data/useRmText"
import { Avatar } from "../common/bits"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"

/**
 * Kişi adları: planda kısa yazılan adlar ("Emrah") Graph'taki ad soyada ("Emrah Durmaz") geçer —
 * kişi, yönetici, PM, sorumlu, aksiyon ve iş sahibi alanlarının hepsinde, tek kayıtta (Geri al'lı).
 * Graph'ta eşleşmeyen ad olduğu gibi kalır.
 */
export function NamesCard() {
  const { rt } = useRmText()
  const { data, people } = useRm()
  const { commit, editError } = useRmEdit()
  const dir = useSyncExternalStore(subscribePeople, peopleState)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const pairs = useMemo(() => namePairs(data.raw, people), [data.raw, people])

  async function apply() {
    setBusy(true)
    setErr(null)
    try {
      await commit((S) => migrateNames(S, pairs), rt("rm.names.done", { n: pairs.length }))
    } catch (e) {
      setErr(editError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <RmCard icon={UserEdit01Icon} tone="sky" title={rt("rm.names.title")} sub={rt("rm.names.sub")}>
      {dir.status !== "ready" ? (
        <>
          <p className="text-sm text-muted-foreground">
            {rt(dir.status === "unavailable" ? "rm.names.unavailable" : "rm.names.loading")}
          </p>
          {dir.status === "unavailable" && <ErrorCause detail={dir.detail} className="mt-2" />}
        </>
      ) : pairs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{rt("rm.names.none")}</p>
      ) : (
        <>
          <ul className="grid max-h-72 gap-0.5 overflow-y-auto [scrollbar-width:thin] @[48rem]/rm:grid-cols-2 @[48rem]/rm:gap-x-6">
            {pairs.map((x) => (
              <li key={x.old} className="flex min-h-10 items-center gap-2.5 text-sm">
                <Avatar name={x.nv} size="sm" />
                <span className="sr-only">{rt("rm.names.sr", { old: x.old, nv: x.nv })}</span>
                <span aria-hidden="true" className="min-w-0 flex-1 truncate">
                  <span className="text-muted-foreground">{x.old}</span>
                  <span className="mx-1.5 text-muted-foreground">→</span>
                  <span className="font-medium">{x.nv}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {rt("rm.names.uses", { n: x.uses })}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={apply}
              disabled={busy}
              className="h-9 bg-brand-fill-deep px-3.5 text-[0.8125rem] text-brand-on-brand hover:bg-brand-fill-deep pointer-coarse:h-11"
            >
              {rt("rm.names.apply", { n: pairs.length })}
            </Button>
            {err && <p className="text-xs text-danger-ink">{err}</p>}
          </div>
        </>
      )}
    </RmCard>
  )
}

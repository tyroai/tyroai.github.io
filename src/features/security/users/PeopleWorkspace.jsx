import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Undo02Icon from "@hugeicons/core-free-icons/Undo02Icon"
import { Gate } from "@/features/admin/AuthorizationsPage"
import { DestructiveDialog } from "@/features/security/dialogs"
import { appCounts, isStale } from "@/lib/authzView"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { AddPersonFab } from "./AddPersonFab"
import { BulkDialog } from "./BulkDialog"
import { draftState } from "./detailDraft"
import { DetailFrame } from "./DetailFrame"
import { PeopleList } from "./PeopleList"
import { PeopleToolbar } from "./PeopleToolbar"
import { PhoneFilterSheet } from "./PhoneFilterSheet"
import { SelectionBar } from "./SelectionBar"
import { usePeopleList } from "./usePeopleList"

// Bu pencere genişliğinden itibaren ayrıntı kabuğun kenar panelinde (sohbet gibi); altında sağdan
// açılan pencere. Pencereye bakılır, listeye değil: panel açılınca liste daralır, kip dönmemeli.
const DOCK_QUERY = "(min-width: 1180px)"

/** Kabın genişliği (boyamadan önce ölçülür: düzen bir kare bile yanlış çizilmez). */
function useWidth(ref) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setWidth(el.getBoundingClientRect().width)
    if (typeof ResizeObserver === "undefined") return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/**
 * KİŞİLER — yöneticinin çalışma alanı. Masaüstünde usta–ayrıntı (liste + sağda kişinin bölmesi),
 * seçim ve toplu işlem (seçim çubuğu → `BulkDialog`); telefonda tek sütun liste, filtre ve ayrıntı
 * çekmecede, "Seç" ile seçim modu, "Kişi ekle" yüzen düğmede. Veri ve eylemler `ctx`ten
 * (`useAuthorizationsAdmin`), liste durumu URL'den (`view`).
 */
export function PeopleWorkspace({ ctx, view, phone, onAdd, scrollRef }) {
  const { t, authorizations, catalog, known, setDraft, setUpnDraft } = ctx
  const boxRef = useRef(null)
  const width = useWidth(boxRef)
  const [openId, setOpenId] = useState(null)
  const [selecting, setSelecting] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [bulk, setBulk] = useState(null)
  const list = usePeopleList({ rows: authorizations, view, known, phone })

  const dockable = useMediaQuery(DOCK_QUERY)
  const mode = phone ? "phone" : dockable ? "dock" : "sheet"
  const showCheck = !phone || selecting
  const wide = !phone && width >= 720
  const open = openId ? (authorizations.find((r) => r.id === openId) ?? null) : null
  const counts = useMemo(
    () => ({
      admins: authorizations.filter((r) => r.isAdmin).length,
      stale: authorizations.filter((r) => isStale(r, known)).length,
    }),
    [authorizations, known],
  )
  const appOptions = useMemo(() => appCounts(authorizations, catalog), [authorizations, catalog])
  const selectedRows = useMemo(
    () => authorizations.filter((r) => list.selected.has(r.id)),
    [authorizations, list.selected],
  )

  const switchTo = useCallback(
    (id) => {
      const row = authorizations.find((r) => r.id === id)
      if (!row) return
      setDraft({ id, apps: row.apps })
      setUpnDraft({ id: null, text: "" })
      setOpenId(id)
    },
    [authorizations, setDraft, setUpnDraft],
  )
  const closeNow = useCallback(() => {
    const id = openId
    setOpenId(null)
    setDraft({ id: null, apps: [] })
    setUpnDraft({ id: null, text: "" })
    // Odak açan satıra döner (klavyeyle gezinme kopmasın).
    requestAnimationFrame(() => document.querySelector(`[data-person-row="${id}"]`)?.focus())
  }, [openId, setDraft, setUpnDraft])
  // Kaydedilmemiş taslak sessizce atılmaz (M365/Entra): başka kişiye geçerken ya da kapatırken
  // sorulur — telefonda Geri ile kapatırken de (`false`: çekmecenin geri adımı yeniden eklenir).
  const dirty = useMemo(() => (open ? draftState(ctx, open).dirty : false), [ctx, open])
  const [pendingNav, setPendingNav] = useState(null)
  const openRow = useCallback(
    (id) => {
      if (id === openId) return
      if (dirty) setPendingNav({ to: id })
      else switchTo(id)
    },
    [openId, dirty, switchTo],
  )
  const close = useCallback(() => {
    if (!dirty) return closeNow()
    setPendingNav({ to: null })
    return false
  }, [dirty, closeNow])
  // Telefonda Seç kipi Geri ile kapanır (seçim temizlenir), sayfadan çıkılmaz.
  useBackToClose(phone && selecting, () => {
    setSelecting(false)
    list.clear()
  })

  // Bölme açıkken Esc kapatır — açık bir kutu/açılır yoksa (onlar kendi Esc'ini kullanır).
  useEffect(() => {
    if (mode !== "dock" || !openId) return undefined
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      // Arama kutusunda Esc metni temizler; bölmeyi de kapatmasın.
      if (e.target instanceof Element && e.target.closest("input, textarea")) return
      if (document.querySelector("[role=dialog], [data-radix-popper-content-wrapper]")) return
      e.stopPropagation()
      close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode, openId, close])

  const count = list.selected.size
  const reset = () => view.update({ q: "", role: "all", apps: [] })

  return (
    <Gate ctx={ctx}>
      <div ref={boxRef} className="min-w-0">
        <div className="grid min-w-0 items-start gap-5">
          {/* Telefonda yüzen düğme ve seçim çubuğu son satırı örtmesin. */}
          <section className={cn("min-w-0", phone && "pb-20")}>
            <PeopleToolbar
              view={view}
              total={authorizations.length}
              counts={counts}
              appOptions={appOptions}
              phone={phone}
              onFilter={() => setFilterOpen(true)}
              selecting={selecting}
              onSelecting={(on) => {
                setSelecting(on)
                if (!on) list.clear()
              }}
            />
            <div
              className={cn(
                "mt-3 min-w-0",
                !phone && "rounded-2xl bg-card shadow-[0_0_0_1px_var(--border)]",
              )}
            >
              <PeopleList
                ctx={ctx}
                list={list}
                query={view.q}
                openId={openId}
                // Telefonda seçim modunda satıra dokunmak seçer (iOS Mail / Gmail düzenleme kipi).
                onOpen={phone && selecting ? list.toggle : openRow}
                showCheck={showCheck}
                pager={!phone}
                wide={wide}
                onReset={reset}
                onAdd={onAdd}
              />
            </div>
            {count > 0 && (
              <SelectionBar
                count={count}
                phone={phone}
                onGrant={() => setBulk("grant")}
                onRevoke={() => setBulk("revoke")}
                onClear={list.clear}
              />
            )}
          </section>
        </div>
      </div>

      <DetailFrame ctx={ctx} row={open} mode={mode} onClose={close} />
      {phone && (
        <PhoneFilterSheet
          open={filterOpen}
          onOpenChange={setFilterOpen}
          view={view}
          rows={authorizations}
          known={known}
          counts={counts}
          appOptions={appOptions}
        />
      )}
      {phone && !selecting && count === 0 && <AddPersonFab onClick={onAdd} scrollRef={scrollRef} />}
      {bulk && (
        <BulkDialog
          ctx={ctx}
          mode={bulk}
          rows={selectedRows}
          onClose={() => setBulk(null)}
          onDone={() => {
            const first = selectedRows[0]?.id
            list.clear()
            // Seçim çubuğu (açan düğme) kalktı: odak gövdeye düşmesin, ilk etkilenen satıra.
            if (first)
              setTimeout(() => document.querySelector(`[data-person-row="${first}"]`)?.focus(), 60)
          }}
        />
      )}
      <DestructiveDialog
        open={!!pendingNav}
        onOpenChange={(o) => !o && setPendingNav(null)}
        icon={Undo02Icon}
        title={t("security.discard.title")}
        description={t("security.discard.body")}
        subject={open?.upn}
        confirmLabel={t("security.discard.confirm")}
        cancelLabel={t("security.discard.keep")}
        onConfirm={() => {
          const to = pendingNav?.to
          setPendingNav(null)
          if (to) switchTo(to)
          else closeNow()
        }}
      />
      <DestructiveDialog
        open={!!ctx.confirmDeleteAuth}
        onOpenChange={(o) => !o && ctx.setConfirmDeleteAuth(null)}
        icon={Delete02Icon}
        title={t("authz.delete.title")}
        description={t("authz.delete.body.short")}
        subject={ctx.confirmDeleteAuth?.upn}
        consequences={[
          { kind: "lose", text: t("authz.delete.lose.apps") },
          ...(ctx.confirmDeleteAuth?.isAdmin
            ? [{ kind: "lose", text: t("authz.delete.lose.admin") }]
            : []),
          { kind: "keep", text: t("authz.delete.keep.requests") },
        ]}
        confirmLabel={t("authz.req.delete")}
        cancelLabel={t("authz.cancel")}
        onConfirm={async () => {
          await ctx.removeAuthorization(ctx.confirmDeleteAuth)
          setOpenId(null)
          setDraft({ id: null, apps: [] })
        }}
        busy={ctx.busyId === ctx.confirmDeleteAuth?.id}
      />
    </Gate>
  )
}

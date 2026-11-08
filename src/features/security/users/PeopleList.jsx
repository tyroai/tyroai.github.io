import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import UserMultipleIcon from "@hugeicons/core-free-icons/UserMultipleIcon"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useLocale } from "@/hooks/useLocale"
import { ExportButton, Pager } from "./PeopleToolbar"
import { useConfig } from "@/hooks/useConfig"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { catalogNameKey } from "@/lib/agentName"
import { PersonRow } from "./PersonRow"

/**
 * Liste klavyesi (Gmail/Linear): ↑/↓ satırlar arası odak, `x` odaktaki satırı seçer (Shift ile
 * aralık); Enter satırın kendi düğmesi.
 */
function listKeys(e, toggle, canSelect) {
  const rows = [...e.currentTarget.querySelectorAll("[data-person-row]")]
  const at = rows.indexOf(document.activeElement)
  if (at === -1 || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === "x" || e.key === "X") {
    if (!canSelect) return
    e.preventDefault()
    toggle(rows[at].dataset.personRow, { shift: e.shiftKey })
    return
  }
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
  e.preventDefault()
  rows[Math.min(rows.length - 1, Math.max(0, at + (e.key === "ArrowDown" ? 1 : -1)))]?.focus()
}

// Kısmi seçim: kutuda tik yerine çizgi (Gmail); ortak kutunun yalnız tikli görünüşü var.
const MIXED =
  "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:[&_svg]:hidden data-[state=indeterminate]:before:h-0.5 data-[state=indeterminate]:before:w-2 data-[state=indeterminate]:before:rounded-full data-[state=indeterminate]:before:bg-current data-[state=indeterminate]:before:content-['']"

function Skeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-border/60">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="flex min-h-14 items-center gap-3 px-4 opacity-60">
          <span className="size-8 rounded-full bg-foreground/[0.08]" />
          <span className="h-3 w-48 rounded bg-foreground/[0.08]" />
          <span className="h-3 w-24 rounded bg-foreground/[0.06]" />
        </li>
      ))}
    </ul>
  )
}

/**
 * Kişiler listesi: başlık satırı (sayfanın hepsini seç + sütun adları), Gmail'in "filtrelenen
 * hepsini seç" bandı, satırlar; yükleniyor iskeleti, boş ve "filtreyle eşleşen yok" durumları.
 */
export function PeopleList({
  ctx,
  list,
  query = "",
  openId,
  onOpen,
  showCheck,
  pager,
  wide,
  onReset,
  onAdd,
}) {
  const { t, locale } = useLocale()
  const { status, authorizations, known, myUpn } = ctx
  const total = list.filtered.length
  // Office fotoğrafları yalnız görünen sayfanın satırları için (850 değil, en çok sayfa boyu).
  const photos = usePeoplePhotos(
    list.shown.map((r) => r.upn),
    { size: 64 },
  )
  const { allAgents, allAiApps, businessApps } = useConfig()
  // Ad → katalog kaydı: çiplerde Anasayfa'daki gerçek logo.
  const logos = useMemo(
    () =>
      new Map(
        [...(allAgents ?? []), ...(allAiApps ?? []), ...(businessApps ?? [])].map((i) => [
          catalogNameKey(i.name),
          i,
        ]),
      ),
    [allAgents, allAiApps, businessApps],
  )
  if (!authorizations.length) {
    if (status === "loading" || status === "idle") return <Skeleton />
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <HugeiconsIcon
          icon={UserMultipleIcon}
          className="size-6 text-muted-foreground"
          strokeWidth={1.6}
        />
        <p className="text-sm text-muted-foreground">{t("authz.list.empty")}</p>
        <Button onClick={() => onAdd()} variant="outline" className="h-9 px-3 text-[0.8125rem]">
          {t("security.add")}
        </Button>
      </div>
    )
  }
  if (!total) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">{t("authz.search.empty")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onReset} variant="outline" className="h-9 px-3 text-[0.8125rem]">
            {t("security.people.clearFilters")}
          </Button>
          {/* Aranan kişi listede yok: yazılan metinle "Kişi ekle" (M365); kutu adresi önerir. */}
          {query.trim() && (
            <Button
              onClick={() => onAdd(query.trim())}
              variant="outline"
              className="h-9 px-3 text-[0.8125rem]"
            >
              {t("security.add")}
            </Button>
          )}
        </div>
      </div>
    )
  }
  const banner = showCheck && list.pageAllOn && total > list.shown.length
  const headState = list.pageAllOn ? true : list.pageSomeOn ? "indeterminate" : false
  return (
    <div className="min-w-0">
      {/* Gmail başlık satırı: sayfanın hepsini seç · sütun adları · sayaç ve sayfa okları. */}
      {(showCheck || pager) && (
        <div className="flex min-h-11 items-center border-b border-border/60 pe-2">
          {showCheck &&
            (pager ? (
              <span className="grid w-11 shrink-0 place-items-center ps-1">
                <Checkbox
                  checked={headState}
                  onCheckedChange={list.togglePage}
                  aria-label={t("security.people.selectPage")}
                  className={MIXED}
                />
              </span>
            ) : (
              // Telefonda başlık satırında yalnız bu var: yazılı etiket, tüm satır dokunulur.
              <label className="flex min-h-11 flex-1 cursor-pointer items-center text-[0.8125rem] font-medium">
                <span className="grid w-11 shrink-0 place-items-center ps-1">
                  <Checkbox
                    checked={headState}
                    onCheckedChange={list.togglePage}
                    className={MIXED}
                  />
                </span>
                {t("authz.ws.editor.all")}
              </label>
            ))}
          {wide && (
            <span
              lang={locale}
              aria-hidden="true"
              className="flex min-w-0 flex-1 gap-4 ps-11 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
            >
              <span className="w-[18rem] shrink-0">{t("authz.ws.col.user")}</span>
              <span className="truncate">{t("authz.ws.col.apps")}</span>
            </span>
          )}
          {pager && (
            <span className="ms-auto flex shrink-0 items-center ps-2">
              <Pager list={list} total={authorizations.length} />
              <ExportButton rows={list.filtered} />
            </span>
          )}
        </div>
      )}
      {banner && (
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-border/60 bg-foreground/[0.03] px-4 py-2 text-center text-[0.8125rem]">
          {list.allFilteredOn ? (
            <span>{t("security.people.allFilteredSelected", { n: total })}</span>
          ) : (
            <>
              <span>{t("security.people.pageSelected", { n: list.shown.length })}</span>
              <button
                type="button"
                onClick={list.selectFiltered}
                className="rounded font-semibold text-brand-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {t("security.people.selectFiltered", { n: total })}
              </button>
            </>
          )}
        </p>
      )}
      <ul
        aria-label={t("security.tab.people")}
        onKeyDown={(e) => listKeys(e, list.toggle, showCheck)}
        className="divide-y divide-border/60"
      >
        {list.shown.map((row) => (
          <PersonRow
            key={row.id}
            row={row}
            known={known}
            self={row.upn.trim().toLowerCase() === myUpn}
            checked={list.selected.has(row.id)}
            open={openId === row.id}
            showCheck={showCheck}
            wide={wide}
            photo={photos.get(row.upn.trim().toLowerCase())}
            logos={logos}
            onToggle={list.toggle}
            onOpen={onOpen}
          />
        ))}
      </ul>
      {list.hasMore && (
        <div className="p-3">
          <Button
            variant="ghost"
            onClick={list.showMore}
            className="h-11 w-full text-[0.8125rem] text-muted-foreground"
          >
            {t("security.people.more")}
          </Button>
        </div>
      )}
    </div>
  )
}

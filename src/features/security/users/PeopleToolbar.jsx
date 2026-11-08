import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Download04Icon from "@hugeicons/core-free-icons/Download04Icon"
import FilterHorizontalIcon from "@hugeicons/core-free-icons/FilterHorizontalIcon"
import FilterRemoveIcon from "@hugeicons/core-free-icons/FilterRemoveIcon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { SearchInput } from "@/features/security/primitives"
import { useLocale } from "@/hooks/useLocale"
import { peopleCsv } from "@/features/security/lib/authzPeople"
import { cn } from "@/lib/utils"
import { AppFilter } from "./AppFilter"

const EDITABLE = "input, textarea, select, [contenteditable=''], [contenteditable='true']"
const PAGER =
  "grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/** `/` sayfa araması: yazı alanında değilken ve değiştirici tuş yokken (useHotkey değil). */
function useSlashFocus(boxRef) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest(EDITABLE)) return
      const input = boxRef.current?.querySelector("input")
      if (!input) return
      e.preventDefault()
      input.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [boxRef])
}

/** Süzülmüş listeyi CSV olarak indirir (denetim; M365 "Kullanıcıları dışa aktar"). */
export function ExportButton({ rows }) {
  const { t } = useLocale()
  const download = () => {
    const csv = peopleCsv(rows, {
      header: [t("authz.ws.editor.address"), t("authz.badge.admin"), t("authz.ws.col.apps")],
      yes: t("security.yes"),
      no: t("security.no"),
    })
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `tyro-yetkiler-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
  return (
    <button
      type="button"
      onClick={download}
      disabled={!rows.length}
      title={t("security.people.export")}
      aria-label={t("security.people.export")}
      className={PAGER}
    >
      <HugeiconsIcon icon={Download04Icon} className="size-4" strokeWidth={1.8} />
    </button>
  )
}

/** Gmail tipi sayaç + sayfa okları: "1–50 / 812 (850 içinde) ‹ ›" — listenin başlık satırında. */
export function Pager({ list, total }) {
  const { t, locale } = useLocale()
  const nf = new Intl.NumberFormat(locale)
  const filtered = list.filtered.length
  // Kayıt yokken (yükleniyor ya da boş) sayaç yazılmaz: "0" uydurma bir cevap olurdu.
  if (!total) return null
  return (
    <div className="ms-auto flex shrink-0 items-center gap-1">
      <span className="px-1 text-[0.8125rem] tabular-nums text-muted-foreground">
        {filtered ? `${nf.format(list.from)}–${nf.format(list.to)} / ${nf.format(filtered)}` : "0"}
        {filtered !== total && (
          <span className="text-muted-foreground">
            {" "}
            {t("authz.page.ofTotal", { n: nf.format(total) })}
          </span>
        )}
      </span>
      {list.pageCount > 1 && (
        <>
          <button
            type="button"
            className={PAGER}
            disabled={list.page <= 1}
            onClick={() => list.setPage(list.page - 1)}
            aria-label={t("authz.page.prev")}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            className={PAGER}
            disabled={list.page >= list.pageCount}
            onClick={() => list.setPage(list.page + 1)}
            aria-label={t("authz.page.next")}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 rtl:rotate-180" />
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Kişiler araç çubuğu. Masaüstü: arama (`/`), rol, uygulama (çoklu), sağda sayaç ve sayfa okları;
 * bir filtre uygulanınca en solda "Temizle" (Self Servis'in filtre çubuğundaki gibi).
 * Telefon: arama + "Filtre" (çekmece) + "Seç" (seçim modu).
 */
export function PeopleToolbar({
  view,
  total,
  counts,
  appOptions,
  phone,
  onFilter,
  selecting,
  onSelecting,
}) {
  const { t } = useLocale()
  const boxRef = useRef(null)
  useSlashFocus(boxRef)
  // Kutunun metni yerel: URL yazımı geçişle (transition) gelir, denetimli alan ona bağlı
  // kalsaydı hızlı yazışta harf düşerdi. Dışarıdan temizlenince (özet, "Filtreleri temizle")
  // kutu da boşalır.
  const [text, setText] = useState(view.q)
  const [seenQ, setSeenQ] = useState(view.q)
  if (view.q !== seenQ) {
    setSeenQ(view.q)
    if (view.q === "") setText("")
  }
  const search = (
    <SearchInput
      value={text}
      onChange={(q) => {
        setText(q)
        view.update({ q })
      }}
      placeholder={t("authz.search.users")}
      className={phone ? "max-w-none" : "min-w-[12rem] @[560px]/security:max-w-72"}
    />
  )
  if (phone) {
    const active = (view.role !== "all" ? 1 : 0) + view.apps.length
    return (
      <div ref={boxRef} className="flex items-center gap-1.5">
        {search}
        <button
          type="button"
          onClick={onFilter}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            active ? "bg-foreground/[0.07] text-foreground" : "text-muted-foreground",
          )}
        >
          <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" strokeWidth={1.8} />
          {active ? `${t("authz.filter.label")} · ${active}` : t("authz.filter.label")}
        </button>
        <button
          type="button"
          aria-pressed={selecting}
          onClick={() => onSelecting(!selecting)}
          className={cn(
            "inline-flex h-11 shrink-0 items-center rounded-full px-3 text-[0.8125rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            selecting ? "bg-foreground/[0.07] text-foreground" : "text-muted-foreground",
          )}
        >
          {selecting ? t("security.sel.done") : t("security.sel.mode")}
        </button>
      </div>
    )
  }
  const filtered = view.q !== "" || view.role !== "all" || view.apps.length > 0
  return (
    <div ref={boxRef} className="flex flex-wrap items-center gap-2">
      {filtered && (
        <button
          type="button"
          onClick={() => view.update({ q: "", role: "all", apps: [] })}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
        >
          <HugeiconsIcon icon={FilterRemoveIcon} aria-hidden="true" className="size-3.5" />
          {t("security.filter.clear")}
        </button>
      )}
      {search}
      <SegmentedControl
        label={t("authz.ws.editor.role")}
        value={view.role}
        onChange={(role) => view.update({ role })}
        options={[
          { value: "all", label: t("authz.filter.all") },
          {
            value: "admins",
            label: `${t("authz.filter.admins")}${total ? ` ${counts.admins}` : ""}`,
          },
          {
            value: "stale",
            label: `${t("security.people.stale")}${total ? ` ${counts.stale}` : ""}`,
          },
        ]}
      />
      <AppFilter
        options={appOptions}
        value={view.apps}
        onChange={(apps) => view.update({ apps })}
      />
    </div>
  )
}

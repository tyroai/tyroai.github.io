import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/widgetEdit"
import { CatalogFilters } from "./catalog/CatalogFilters"
import { CatalogTile } from "./CatalogTile"
import { CATALOG } from "./layout"
import { CATALOG_GROUPS, groupCatalog, groupOf, searchCatalog } from "./lib/catalogGroups"
import "./catalog/widgetCatalog.css"

/**
 * "Widget ekle" kataloğu — panoda olmayan widget'lar, gerçek verinle canlı
 * önizlemeleriyle, ne işe yaradıklarına göre bölümlerde (`lib/catalogGroups`). Üstte solda bölüm
 * çipleri, sağda arama düğmesi (ad, açıklama, ⓘ metni ve bölüm adı; Türkçe duyarsız); katalogda
 * yazmaya başlamak da aramayı açar. ÇOKLU SEÇİM:
 * istediklerini işaretle, "Ekle (n)" hepsini birden ekler (sıra işaretleme sırası); seçim
 * filtre değişince korunur. Önizlemeler yalnız pencere açıkken çizilir. Seçim, arama ve bölüm
 * her açılışta boşalır; aramada Esc önce aramayı temizler, sonra pencereyi kapatır. `onClosed`:
 * pencere kapanınca odağın gideceği yeri sayfa seçer (eklenen karta).
 */
export function WidgetCatalog({ open, onOpenChange, ids, render, onAdd, onClosed }) {
  const { t } = useLocale()
  const [picked, setPicked] = useState([])
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState(null)
  const [searching, setSearching] = useState(false)
  const search = useRef(null)
  // Alan açılınca odak ona (düğmeyle ya da yazmaya başlayınca).
  useEffect(() => {
    if (searching) search.current?.focus()
  }, [searching])
  const toggle = (id) =>
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  const matched = useMemo(
    () =>
      searchCatalog(ids, query, (id) =>
        [
          t(CATALOG[id].title),
          t(`widgets.catalog.${id}`),
          t(`widgets.info.${id}`),
          t(`widgetEdit.group.${groupOf(id)}`),
        ].join(" "),
      ),
    [ids, query, t],
  )
  const counts = CATALOG_GROUPS.map((g) => ({
    id: g.id,
    count: matched.filter((id) => groupOf(id) === g.id).length,
  })).filter((g) => ids.some((id) => groupOf(id) === g.id))
  const sections = groupCatalog(group ? matched.filter((id) => groupOf(id) === group) : matched)
  const reset = () => {
    setPicked([])
    setQuery("")
    setSearching(false)
    setGroup(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={onClosed}
        // Odak pencerenin kendisinde (arama düğmesi kapalı kalsın); yazmaya başlamak aramayı açar.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          e.target?.focus?.()
        }}
        onKeyDown={(e) => {
          const el = e.target instanceof Element ? e.target : null
          if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey || e.key === " ") return
          if (el?.closest("input, textarea, [contenteditable='true']")) return
          // Alan açıksa odağı al, harf oraya düşer; kapalıysa harfi biz yazar, alanı açarız.
          if (search.current) return search.current.focus()
          e.preventDefault()
          setQuery((q) => q + e.key)
          setSearching(true)
        }}
        onEscapeKeyDown={(e) => {
          if (!query) return
          e.preventDefault()
          setQuery("")
        }}
        // `overflow-clip`, `hidden` DEĞİL: gizli taşma kodla kaydırılabiliyor — kutu seçilince
        // tarayıcı onay kutusunu göstermek için pencereyi kaydırıyor, başlık ekrandan çıkıyordu.
        className="flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-clip p-0 sm:max-h-[88vh] sm:max-w-5xl"
      >
        <DialogHeader className="relative border-b border-border px-5 pt-4 pb-3 sm:px-6">
          <DialogTitle className="text-base font-semibold">{t("widgets.add")}</DialogTitle>
          <DialogDescription className="text-[0.8125rem]">
            {t("widgets.catalogDialog.hint")}
          </DialogDescription>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 end-3 pointer-coarse:size-11"
              aria-label={t("sheet.close")}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </DialogClose>
        </DialogHeader>
        {open && ids.length > 0 && (
          <CatalogFilters
            inputRef={search}
            query={query}
            onQuery={setQuery}
            searching={searching}
            onSearching={setSearching}
            groups={counts}
            group={group}
            onGroup={setGroup}
            total={matched.length}
          />
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {!open ? null : !ids.length ? (
            <p className="py-10 text-center text-[0.8125rem] text-muted-foreground">
              {t("widgets.addEmpty")}
            </p>
          ) : sections.length ? (
            <div
              role="group"
              aria-label={t("widgets.catalogDialog.list")}
              className="widget-catalog__sections"
            >
              {sections.map((sec) => (
                <section key={sec.id} aria-labelledby={`wc-${sec.id}`}>
                  <h3 id={`wc-${sec.id}`} className="widget-catalog__heading">
                    {t(`widgetEdit.group.${sec.id}`)}
                    <span className="widget-catalog__count">{sec.ids.length}</span>
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {sec.ids.map((id) => (
                      <CatalogTile
                        key={id}
                        id={id}
                        render={render}
                        checked={picked.includes(id)}
                        onToggle={() => toggle(id)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="widget-catalog__empty">
              <p>{t("widgetEdit.none", { q: query.trim() })}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  setGroup(null)
                  search.current?.focus()
                }}
                className="widget-catalog__reset"
              >
                {t("widgetEdit.searchClear")}
              </button>
            </div>
          )}
          <p role="status" aria-live="polite" className="sr-only">
            {query.trim() ? t("widgetEdit.found", { n: matched.length }) : ""}
          </p>
        </div>
        {/* Telefonda da TEK satır: sayı solda, düğmeler sağda (alt alta üç satır yer yiyordu). */}
        <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3 sm:px-6">
          <p aria-live="polite" className="me-auto text-[0.8125rem] text-muted-foreground">
            {t("widgets.catalogDialog.picked", { n: picked.length })}
          </p>
          <DialogClose asChild>
            <Button variant="outline" className="pointer-coarse:h-11">
              {t("widgets.drop.cancel")}
            </Button>
          </DialogClose>
          <Button
            disabled={!picked.length}
            onClick={() => {
              onAdd(picked)
              reset()
            }}
            className="bg-brand-fill-deep text-brand-on-brand hover:bg-brand-fill-deep pointer-coarse:h-11"
          >
            {t("widgets.catalogDialog.add", { n: picked.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

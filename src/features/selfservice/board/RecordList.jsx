import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import FilterRemoveIcon from "@hugeicons/core-free-icons/FilterRemoveIcon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { recordKey } from "@/lib/selfServiceModel"
import { LIST_PAGE, limitGroups } from "@/features/selfservice/lib/selfServicePaging"
import { cn } from "@/lib/utils"
import { GHOST } from "../chips"
import { MONTH, tabOf } from "../kinds"
import { usePhone } from "../layout/phone"
import { RecordRow } from "../RecordRow"
import { StateDetail } from "../StateDetail"
import { ListMore } from "./ListMore"

const NO_KEYS = new Set()

/** Listenin eksik olabileceğini söyleyen notlar: durumlar okunamadı · geçmiş sınıra vardı. */
function PartialNotes({ view }) {
  const { t } = useLocale()
  const notes = [
    view.statusUnknown && t("selfService.statusFailed"),
    view.truncated && t("selfService.truncated"),
  ].filter(Boolean)
  if (!notes.length) return null
  return (
    <div role="status" className="mb-2 space-y-1">
      {notes.map((text) => (
        <p
          key={text}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[0.75rem] text-amber-800 dark:text-amber-300"
        >
          {text}
        </p>
      ))}
    </div>
  )
}

/**
 * Boş liste: ne olduğunu söyler ve bir sonraki adımı verir — süzgeç varsa "Temizle", yoksa o
 * sekmenin yeni talebi; seçili yıl boşsa ama başka yıllarda kayıt varsa "Tüm yıllara bak".
 */
function EmptyList({ tab, filtered, onNew, onClear, onAllYears }) {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-9 text-center"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-brand/10 text-brand-ink">
        <HugeiconsIcon
          icon={tabOf(tab).icon}
          aria-hidden="true"
          className="size-5"
          strokeWidth={1.8}
        />
      </span>
      <p className="mt-3 text-[0.875rem] font-semibold text-foreground/85">
        {t(filtered ? "selfService.empty.noMatch" : `selfService.empty.${tab}`)}
      </p>
      <p className="mt-1 max-w-sm text-[0.8125rem] leading-relaxed text-muted-foreground">
        {t(filtered ? "selfService.empty.filtered" : "selfService.empty.start")}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {filtered ? (
          <button
            type="button"
            onClick={onClear}
            className={cn(GHOST, "bg-muted hover:bg-accent px-3")}
          >
            <HugeiconsIcon icon={FilterRemoveIcon} aria-hidden="true" strokeWidth={1.9} />
            {t("selfService.filter.clear")}
          </button>
        ) : (
          onNew && (
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => onNew(tab)}
              className={cn(
                GHOST,
                "bg-brand/[0.09] px-3.5 text-brand-ink hover:bg-brand/[0.15] hover:text-brand-ink",
              )}
            >
              <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" strokeWidth={2.2} />
              {t(`selfService.cta.${tab}`)}
            </button>
          )
        )}
        {onAllYears && (
          <button
            type="button"
            onClick={onAllYears}
            className={cn(GHOST, "bg-muted hover:bg-accent px-3")}
          >
            {t("selfService.report.showAll")}
          </button>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Süzülmüş liste: tek kart içinde ay başlıkları. Okunamayan bölüm ve
 * boş sonuç kendi cümlesiyle; eksik olabilecek liste notuyla. `newKeys`: önceki yüklemede
 * olmayan kayıtlar (`newRecordKeys`) — satırda "Yeni" rozeti. Boş listede sonraki adım
 * (`onNew` · `onClear` · `onAllYears`). Uzun liste parça parça açılır (`LIST_PAGE`, sonda
 * "Daha fazla göster"); `pageKey` (sekme, dönem, filtre, arama) değişince başa döner — veri
 * yenilenince açılan kısım korunur.
 */
export function RecordList({
  tab,
  view,
  failed,
  filtered,
  onOpen,
  onAsk = null,
  openId,
  person = null,
  newKeys = NO_KEYS,
  onNew,
  onClear,
  onAllYears,
  pageKey = "",
}) {
  const { t, locale } = useLocale()
  const phone = usePhone()
  const monthFmt = getDateTimeFormat(locale, MONTH)
  const [paging, setPaging] = useState({ key: pageKey, limit: LIST_PAGE })
  const limit = paging.key === pageKey ? paging.limit : LIST_PAGE
  const page = limitGroups(view.groups, limit)

  if (failed) {
    // Neden, çare ve BT'ye iletilecek kod: yetki eksikse yenilemek çözmez; öteki hatalarda da kod
    // görünür (F&O'nun rol hatası 403 değil 400/500 gelebiliyor).
    return (
      <div
        role="status"
        className="mt-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[0.8125rem] text-amber-800 dark:text-amber-300"
      >
        {t(view.deniedDetail ? "selfService.sectionDenied" : "selfService.sectionFailed")}
        <StateDetail detail={view.failDetail} tone="warn" />
      </div>
    )
  }
  if (!view.groups.length) {
    return (
      <div className="mt-1.5">
        <PartialNotes view={view} />
        <EmptyList
          tab={tab}
          filtered={filtered}
          onNew={onNew}
          onClear={onClear}
          onAllYears={filtered ? null : onAllYears}
        />
      </div>
    )
  }
  return (
    <div className="mt-1.5">
      <PartialNotes view={view} />
      {/* To-Do'nun listesi gibi: ay başlığı kartın üstünde küçük büyük harfle, satırlar beyaz,
          gölgeli kartta (`ms-surface`) içeriden başlayan ince ayraçlarla. */}
      <div className={cn("min-w-0", phone ? "space-y-5 pt-3" : "space-y-6 pt-4")}>
        {page.groups.map((g) => (
          <section
            key={g.key}
            aria-label={g.date ? monthFmt.format(g.date) : t("selfService.noDate")}
            className="min-w-0"
          >
            <h3 className="flex items-baseline gap-2 px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {g.date ? monthFmt.format(g.date) : t("selfService.noDate")}
              <span className="font-medium normal-case tracking-normal">
                · {g.count ?? g.items.length}
              </span>
            </h3>
            <ul data-tour="ss-records" className="ms-surface rounded-[1.5rem] p-1.5">
              {g.items.map((r) => (
                <RecordRow
                  key={recordKey(r)}
                  record={r}
                  onOpen={onOpen}
                  onAsk={onAsk}
                  person={person}
                  highlighted={openId === r.id}
                  isNew={newKeys.has(recordKey(r))}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <ListMore
        shown={page.shown}
        total={page.total}
        onMore={() => setPaging({ key: pageKey, limit: limit + LIST_PAGE })}
        onAll={() => setPaging({ key: pageKey, limit: Infinity })}
      />
    </div>
  )
}

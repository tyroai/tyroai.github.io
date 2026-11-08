import { useCallback, useId, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import NotebookTabsIcon from "@hugeicons/core-free-icons/NotebookTabsIcon"
import { useLocale } from "@/hooks/useLocale"
import { formatFileTime } from "@/lib/filesFormat"
import { fold } from "@/lib/fold"
import { formatCount } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { recentSectionKeys } from "@/lib/onenote/onenoteGroups"
import { OneNotePageRow } from "./OneNotePageRow"

const EASE = [0.22, 1, 0.36, 1]

/**
 * Bul › OneNote'un gruplu görünümü — OneNote'un düzeni: defter başlığı, altında bölümler
 * açılır kapanır (Apple tarzı açılır satır, ok döner). Açılışta en son düzenlenen iki bölüm ve
 * dosyadan gelinen bölüm açık; arama yazılıyken hepsi. Elle açıp kapama yalnız bellekte ve o
 * arama metni için: metin değişince varsayılana döner (eşleşen gruplar kapalı kalmasın).
 */
export function OneNoteSections({ groups, text, focusSection, notebookHeader, now, row }) {
  const [manual, setManual] = useState({ text: "", open: {} })
  const own = manual.text === text ? manual.open : null
  const recent = useMemo(() => recentSectionKeys(groups), [groups])
  const searching = Boolean(text.trim())
  const isOpen = (sec) =>
    own?.[sec.key] ??
    (searching ||
      recent.has(sec.key) ||
      Boolean(focusSection && fold(sec.name) === fold(focusSection)))
  const toggle = useCallback(
    (key, next) =>
      setManual((m) => ({ text, open: { ...(m.text === text ? m.open : {}), [key]: next } })),
    [text],
  )
  return (
    <div className="flex flex-col gap-6">
      {groups.map((nb) => (
        <NotebookGroup key={nb.key} notebook={nb} header={notebookHeader}>
          {nb.sections.map((sec) => (
            <SectionGroup
              key={sec.key}
              section={sec}
              open={isOpen(sec)}
              onToggle={toggle}
              now={now}
              row={row}
            />
          ))}
        </NotebookGroup>
      ))}
    </div>
  )
}

function NotebookGroup({ notebook, header, children }) {
  const { t, locale } = useLocale()
  const id = useId()
  return (
    <section aria-labelledby={header ? id : undefined} className="min-w-0">
      {header && (
        <h3
          id={id}
          className="flex min-w-0 items-center gap-2 px-3 pb-1.5 text-callout font-semibold text-foreground"
        >
          <HugeiconsIcon
            icon={NotebookTabsIcon}
            className="size-3.5 shrink-0 text-muted-foreground"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <span dir="auto" className="min-w-0 truncate">
            {notebook.name || t("onenote.untitledNotebook")}
          </span>
          <span className="font-medium tabular-nums text-muted-foreground">
            {formatCount(locale, notebook.count)}
          </span>
        </h3>
      )}
      <div className="ms-surface divide-y divide-border/60 rounded-[1.5rem] p-1.5">{children}</div>
    </section>
  )
}

function SectionGroup({ section, open, onToggle, now, row }) {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const id = useId()
  const name = section.name || t("onenote.untitledSection")
  const when = section.latest ? formatFileTime(section.latest.toISOString(), now, locale) : ""
  const count = section.pages.length
  return (
    <div className="min-w-0">
      <h4>
        <button
          type="button"
          id={`${id}-h`}
          aria-expanded={open}
          aria-controls={`${id}-p`}
          onClick={() => onToggle(section.key, !open)}
          className="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-[1.125rem] px-3 py-2.5 text-start outline-none transition-colors hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
        >
          <span
            dir="auto"
            className="min-w-0 truncate text-[0.875rem] font-medium leading-snug text-foreground"
          >
            {name}
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 tabular-nums text-footnote text-muted-foreground"
          >
            {formatCount(locale, count)}
          </span>
          <span className="sr-only">{t("onenote.find.pageCount", { count })}</span>
          <span className="ms-auto shrink-0 truncate text-footnote text-muted-foreground">
            {when}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            strokeWidth={2}
          />
        </button>
      </h4>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="p"
            id={`${id}-p`}
            role="region"
            aria-labelledby={`${id}-h`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <ul className="pb-1">
              {section.pages.map((p) => (
                <OneNotePageRow key={p.id} page={p} now={now} crumb={false} {...row} />
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { pathOf } from "@/lib/pageAccess"
import { cn } from "@/lib/utils"
import { FaqItem } from "./HelpFaq"
import { Highlight } from "./Highlight"
import { PAGES_ID, pageDomId } from "./helpContent"
import { PAGES } from "./helpPages"

const GROUP_TITLE = "text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
const ROW =
  "flex min-h-12 w-full items-start gap-3 px-4 py-3 text-start outline-none transition pointer-coarse:min-h-14"
const ACTIVE =
  "hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 dark:hover:bg-white/[0.04]"

/**
 * Sayfa sayfa kılavuz: her sayfa bir blok (başlık + "burada ne yapabilirsin"), açılınca işlevleri
 * (nasıl yapılır, tam yere bağlantı) ve o işlevlerde gelen soruları gösterir. Gezinmede bloklar
 * kapalı gelir (telefonda on bir satır, "en az ile en çok"); aramada eşleşen sayfa HEP açık ve
 * yalnız eşleşen satırlar görünür. `entries`: `{ page, fns, faq }` — süzme sayfada yapılır.
 */
export function HelpPages({
  entries,
  heading,
  searching,
  terms,
  expanded,
  onTogglePage,
  isOpen,
  onToggle,
  onAnchor,
  canOpen,
}) {
  return (
    <section id={PAGES_ID} aria-labelledby={`${PAGES_ID}-title`} className="scroll-mt-28 space-y-3">
      {/* tabIndex -1: menüden gelen kaydırma odağı başlığa taşır (klavyeyle gelen yerini kaybetmesin). */}
      <h2
        id={`${PAGES_ID}-title`}
        tabIndex={-1}
        className="text-base font-semibold tracking-tight outline-none"
      >
        {heading}
      </h2>
      <div className="space-y-2">
        {entries.map(({ page, fns, faq }) => (
          <PageBlock
            key={page.id}
            page={page}
            fns={fns}
            faq={faq}
            open={searching || expanded(page.id)}
            fixed={searching}
            terms={terms}
            onToggle={() => onTogglePage(page.id)}
            isOpen={isOpen}
            onToggleFaq={onToggle}
            onAnchor={onAnchor}
            canOpen={canOpen}
          />
        ))}
      </div>
    </section>
  )
}

/** "<Sayfa>'yı aç" etiketi: adresin gittiği sayfanın adı (ilk eşleşme; Katalog Profilim'den sonra gelir). */
function openLabelFor(to, t) {
  const target = PAGES.find((p) => p.to && pathOf(p.to) === pathOf(to))
  return target ? t(`help.pages.${target.id}.open`) : null
}

function PageBlock({
  page,
  fns,
  faq,
  open,
  fixed,
  terms,
  onToggle,
  isOpen,
  onToggleFaq,
  onAnchor,
  canOpen,
}) {
  const { t, locale } = useLocale()
  const id = pageDomId(page.id)
  const title = t(`help.pages.${page.id}.title`)
  const head = (
    <>
      <HugeiconsIcon
        icon={page.icon}
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.8}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug">
          <Highlight text={title} terms={terms} />
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[0.8125rem] font-normal leading-relaxed text-muted-foreground",
            !open && "line-clamp-2 @2xl/help:line-clamp-none",
          )}
        >
          {t(`help.pages.${page.id}.what`)}
        </span>
      </span>
      {fixed ? null : (
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      )}
    </>
  )
  const openLabel = page.to ? t(`help.pages.${page.id}.open`) : null
  const route = page.to && canOpen(page.to) ? page.to : null
  return (
    <article id={id} className="scroll-mt-28 rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
      <h3 tabIndex={-1} className="rounded-2xl outline-none">
        {fixed ? (
          <span className={cn(ROW, "rounded-2xl")}>{head}</span>
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-body`}
            onClick={onToggle}
            className={cn(ROW, ACTIVE, "rounded-2xl")}
          >
            {head}
          </button>
        )}
      </h3>
      {open ? (
        <div id={`${id}-body`} className="border-t border-border/60 pb-1.5">
          {fns.length ? (
            <>
              <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3">
                <h4 lang={locale} className={GROUP_TITLE}>
                  {t("help.group.functions")}
                </h4>
                {route ? (
                  <Link
                    to={route}
                    className="relative -me-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-10 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
                  >
                    {openLabel}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      aria-hidden="true"
                      className="size-3.5 rtl:rotate-180"
                      strokeWidth={1.9}
                    />
                  </Link>
                ) : null}
              </div>
              <ul className="divide-y divide-border/60">
                {fns.map((fn) => (
                  <li key={fn.id} className="flex">
                    <FunctionRow
                      fn={fn}
                      title={t(`help.fn.${page.id}.${fn.id}.title`)}
                      body={t(`help.fn.${page.id}.${fn.id}.body`)}
                      terms={terms}
                      onAnchor={onAnchor}
                      canOpen={canOpen}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {faq.length ? (
            <>
              <h4 lang={locale} className={cn(GROUP_TITLE, "px-4 pb-1 pt-4")}>
                {t("help.group.faq")}
              </h4>
              <div className="divide-y divide-border/60">
                {faq.map((f) => {
                  // Bağlantının adı HEDEF sayfadan gelir (q1 sohbet sayfasında durur ama Anasayfa'ya gider).
                  const dest = f.to && canOpen(f.to) ? f.to : route
                  const label = dest ? openLabelFor(dest, t) : null
                  return (
                    <FaqItem
                      key={f.n}
                      n={f.n}
                      open={isOpen(f.n)}
                      onToggle={() => onToggleFaq(f.n)}
                      terms={terms}
                      to={label ? dest : null}
                      openLabel={label}
                    />
                  )
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

/** İşlev satırı: gidilen yer varsa gerçek bağlantı (orta tık yeni sekme), ok sağda; yoksa düz metin. */
function FunctionRow({ fn, title, body, terms, onAnchor, canOpen }) {
  const to = fn.to && canOpen(fn.to) ? fn.to : null
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug">
          <Highlight text={title} terms={terms} />
        </span>
        <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted-foreground">
          <Highlight text={body} terms={terms} />
        </span>
      </span>
      {to || fn.anchor ? (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground/60 rtl:rotate-180"
        />
      ) : null}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={cn(ROW, ACTIVE)}>
        {inner}
      </Link>
    )
  }
  if (fn.anchor) {
    return (
      <a
        href={`#${fn.anchor}`}
        onClick={(e) => {
          e.preventDefault()
          onAnchor?.(fn.anchor)
        }}
        className={cn(ROW, ACTIVE)}
      >
        {inner}
      </a>
    )
  }
  return <div className={ROW}>{inner}</div>
}

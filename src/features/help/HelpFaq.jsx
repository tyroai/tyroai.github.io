import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Link04Icon from "@hugeicons/core-free-icons/Link04Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { faqAnchor, faqDomId } from "./helpContent"
import { Highlight } from "./Highlight"

const QUIET_LINK =
  "relative -ms-2 mt-1.5 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-10 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"

/**
 * Bir soru: akordeon (soru `h5` içinde `button`, cevap `role="region"`). Her soru derin
 * bağlantılı (`#faq-qN`); açık cevabın altında sessiz "Sayfayı aç" (`to` + `openLabel`: sorunun
 * sorulduğu yere) ve "Bağlantıyı kopyala". Hareket `useReducedMotion`'a uyar.
 */
export function FaqItem({ n, open, onToggle, terms, to, openLabel }) {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  const id = faqDomId(n)
  return (
    // scroll-mt: yapışkan arama kutusu derin bağlantıyla gelen sorunun üstünü örtmesin.
    <div id={id} className="scroll-mt-28">
      <h5 className="text-sm font-medium">
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-start leading-snug outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 pointer-coarse:min-h-14"
        >
          <span className="min-w-0 flex-1">
            <Highlight text={t(`help.faq.q${n}`)} terms={terms} />
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
      </h5>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="a"
            id={`${id}-a`}
            role="region"
            aria-labelledby={`${id}-q`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {/* Cevap sayfanın asıl içeriği: soluk 13 px meta yazı değil, okunur gövde metni. */}
              <p className="max-w-[44rem] text-sm leading-relaxed text-foreground/75">
                <Highlight text={t(`help.faq.a${n}`)} terms={terms} />
              </p>
              <div className="flex flex-wrap items-center gap-x-2">
                {to ? (
                  <Link to={to} className={QUIET_LINK}>
                    {openLabel}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      aria-hidden="true"
                      className="size-3.5 rtl:rotate-180"
                      strokeWidth={1.9}
                    />
                  </Link>
                ) : null}
                <CopyLink anchor={faqAnchor(n)} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/** Sorunun adresini panoya yazar; 2 sn "Bağlantı kopyalandı" (ekran okuyucuya da söylenir). */
function CopyLink({ anchor }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Pano kapalı (izin/iframe): adres çubuğunda aynı bağlantı olsun.
      window.history.replaceState(window.history.state, "", `#${anchor}`)
    }
  }

  return (
    <button type="button" onClick={copy} className={QUIET_LINK}>
      <HugeiconsIcon
        icon={copied ? Tick02Icon : Link04Icon}
        aria-hidden="true"
        className={cn("size-3.5", copied && "text-success-ink")}
        strokeWidth={1.9}
      />
      <span aria-live="polite">{copied ? t("help.faq.copied") : t("help.faq.copyLink")}</span>
    </button>
  )
}

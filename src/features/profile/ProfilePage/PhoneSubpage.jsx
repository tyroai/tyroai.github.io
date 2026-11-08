import { useEffect, useRef } from "react"
import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import { useLocale } from "@/hooks/useLocale"

/**
 * Telefon alt sayfası: yapışkan üst çubukta "‹ Profilim" ve bölüm adı (sayfanın h1'i). Açılınca
 * odak başlığa gelir: ekran okuyucu yeni sayfanın adını okur, Tab üst çubuktan başlar. Odak ve
 * giriş hareketi bölüm kimliğine bağlı, başlığa değil: Görünüm'de dil değişince başlık çevrilir
 * ama odak seçilen dilde kalır.
 */
export function PhoneSubpage({ id, title, onBack, children }) {
  const { t } = useLocale()
  const headingRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [id])

  return (
    <div>
      {/* Üstte 1,25rem boş şerit: telefonda header'dan sarkan çentik tutamacı başlığın üstüne
          binmesin (yapışınca da tutamaç bu şeridin üstünde kalır). */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 border-b border-border/60 bg-background/90 pt-5 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:-mx-6">
        {/* Yanlar eşit ve kısalabilir: uzun geri etiketi (RU "Мой профиль") başlığı ortadan kaydırmaz. */}
        <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-1">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("profile.hub.backTo")}
            className="inline-flex h-11 min-w-11 max-w-full items-center gap-0.5 justify-self-start rounded-lg pe-2 ps-1 text-sm text-foreground/85 outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-5 shrink-0 rtl:rotate-180"
              strokeWidth={2}
            />
            <span className="min-w-0 truncate">{t("profile.title")}</span>
          </button>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="max-w-[12rem] truncate text-center text-[0.9375rem] font-semibold outline-none"
          >
            {title}
          </h1>
          <span aria-hidden="true" />
        </div>
      </div>
      {/* iOS'taki gibi içerik hafifçe yandan gelir; üst çubuk yerinde kalır. */}
      <motion.div
        key={id}
        initial={reduce ? false : { opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="pt-5"
      >
        {children}
      </motion.div>
    </div>
  )
}

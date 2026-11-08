import "@/lib/i18n/tour"
import { motion, useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const BADGE = "text-[color-mix(in_oklch,var(--brand-to)_62%,white)]"

/**
 * Turun kartı (sayfa turu ve formun ipuçları aynı kart): sayaç (yeni adımlarda "Yeni"), başlık,
 * maddeler ve Turu geç · Geri · İleri/Tamam. Metinler `tour.<tur>.<adım>.title|<madde>`; madde bir
 * işlevse `(görünen hedefler, dil)` ile anahtarını seçer ya da `null` ile düşer. `doneKey`: son
 * adımın düğmesi (sayfa turunda "Başlayalım", pencere içi ipucunda "Anladım").
 * Canlı bölge KALICI, içi adımla yeniden doğar: yeni eklenen canlı bölgenin içeriği okunmaz,
 * değişen içeriği okunur.
 */
export function TourCard({
  tourId,
  step,
  index,
  total,
  delta,
  shown = [],
  titleId,
  bodyId,
  primaryRef,
  doneKey = "tour.done",
  onSkip,
  onBack,
  onNext,
}) {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const last = index === total - 1
  // Tek adımlık ipucunda sayaç yok ("1 / 1" bilgi taşımıyor); yeni adımlarda "Yeni" önde.
  const counter = total > 1 ? t("tour.counter", { n: index + 1, total }) : null
  const badge = [delta && t("tour.new"), counter].filter(Boolean).join(" · ")
  return (
    <>
      <div aria-live="polite">
        <motion.div
          key={step.id}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {badge && (
            <p className={cn("text-[0.6875rem] font-semibold uppercase tracking-[0.1em]", BADGE)}>
              {badge}
            </p>
          )}
          <h2 id={titleId} className="mt-1 text-[0.9375rem] font-semibold leading-snug">
            {t(`tour.${tourId}.${step.id}.title`)}
          </h2>
          <ul id={bodyId} className="mt-2 space-y-1.5">
            {step.items
              .map((item) => (typeof item === "function" ? item(shown, locale) : item))
              .filter(Boolean)
              .map((key) => (
                <li key={key} className="flex gap-2 text-[0.8125rem] leading-relaxed text-white/80">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-[color-mix(in_oklch,var(--brand-to)_62%,white)]"
                  />
                  <span>{t(`tour.${tourId}.${step.id}.${key}`)}</span>
                </li>
              ))}
          </ul>
        </motion.div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            "rounded-full px-2 py-1.5 text-[0.75rem] font-medium text-white/60 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60",
            last && "invisible",
          )}
        >
          {t("tour.skip")}
        </button>
        <div className="flex gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-white outline-none ring-1 ring-white/20 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {t("tour.back")}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={onNext}
            className={cn(
              "rounded-full bg-gradient-to-br from-brand-from via-brand-via to-brand-to px-3.5 py-1.5 text-[0.75rem] font-semibold text-brand-on-ramp outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/70",
              "[@media(pointer:coarse)]:min-h-10",
            )}
          >
            {last ? t(doneKey) : t("tour.next")}
          </button>
        </div>
      </div>
    </>
  )
}

import { useRef } from "react"
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import { COMPANIES } from "@/data/companies"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { TeamContacts } from "./TeamContacts"

const SPRING = { stiffness: 220, damping: 20 }

/**
 * Kişi kartı. ⚠️ **ETKİLEŞİM SÜS, BİLGİ DEĞİL**: fareyle kart imleci izleyerek
 * hafifçe EĞİLİR (en çok 4–5°, ışık parlaması), fotoğraf ters yöne kayar
 * (derinlik) ve kenarda paletin gradyanı yanar. Kartın bütün bilgisi her
 * durumda görünür. Dokunmatikte ve "hareketi azalt"ta eğim de kayma da yok.
 * ⚠️ **TIKLANACAK YERDE KART DÜZ** (`data-tilt-off`): imleç iletişim
 * düğmelerine inince kart düzleşir — eğilen bir yüzeyde hedef imlecin altından
 * kayıyor ve küçük düğmeye basmak zorlaşıyordu.
 */
export function TeamCard({ member, index, isDark }) {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [4, -4]), SPRING)
  const rotateY = useSpring(useTransform(px, [0, 1], [-5, 5]), SPRING)
  const photoX = useSpring(useTransform(px, [0, 1], [4, -4]), SPRING)
  const photoY = useSpring(useTransform(py, [0, 1], [4, -4]), SPRING)
  const glareX = useTransform(px, (v) => `${v * 100}%`)
  const glareY = useTransform(py, (v) => `${v * 100}%`)
  const glare = useMotionTemplate`radial-gradient(28rem circle at ${glareX} ${glareY}, rgb(255 255 255 / ${isDark ? 0.1 : 0.35}), transparent 55%)`

  function onMove(e) {
    if (reduce || e.pointerType !== "mouse") return
    if (e.target.closest?.("[data-tilt-off]")) {
      onLeave()
      return
    }
    const r = ref.current.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  function onLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  const titleId = `team-${member.id}`
  const company = COMPANIES.find((c) => c.id === member.company)
  const parent = company?.parent ? COMPANIES.find((c) => c.id === company.parent) : null
  return (
    <motion.article
      ref={ref}
      aria-labelledby={titleId}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      className={cn(
        "group relative rounded-[1.75rem] bg-gradient-to-br p-[1.5px] shadow-xl transition-[background-color,box-shadow] duration-300",
        "from-brand-from/35 via-brand-via/25 to-brand-to/35 hover:from-brand-from hover:via-brand-via hover:to-brand-to hover:shadow-2xl",
        "focus-within:from-brand-from focus-within:via-brand-via focus-within:to-brand-to",
      )}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[calc(1.75rem-1.5px)] p-5",
          isDark ? "bg-[#121216]/95" : "bg-white/95",
        )}
      >
        {/* Geniş ekranda YATAY: fotoğraf solda, kim olduğu sağda — iki kart başlıkla
            birlikte dizüstünde de (≈650 px görünür yükseklik) kaydırmadan sığsın.
            Telefonda dikey: büyük fotoğraf, altında yazı. */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl sm:w-40 lg:w-44">
            {/* Siyah-beyaz, üstüne gelince (ya da klavye odağında) renkli: farklı ışık
              ve fonda çekilmiş fotoğraflar bir set gibi dursun. Dosyalar renkli kalır. */}
            <motion.img
              src={member.photo}
              alt={member.name}
              loading="lazy"
              decoding="async"
              style={reduce ? undefined : { x: photoX, y: photoY }}
              className={cn(
                "size-full scale-[1.08] object-cover contrast-[1.06] grayscale transition-[transform,translate,scale,rotate,filter] duration-500",
                "group-focus-within:contrast-100 group-focus-within:grayscale-0 group-hover:scale-[1.12] group-hover:contrast-100 group-hover:grayscale-0",
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-[1.25rem] font-semibold leading-snug tracking-[-0.01em]"
            >
              {member.name}
            </h2>
            <p className="mt-0.5 bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-[0.875rem] font-semibold text-transparent">
              {t(`team.member.${member.id}.role`)}
            </p>
            {company && (
              <p
                className={cn(
                  "mt-1 flex items-start gap-1.5 text-[0.8125rem]",
                  isDark ? "text-white/60" : "text-[#1a1a1a]/60",
                )}
              >
                <HugeiconsIcon
                  icon={Building03Icon}
                  className="mt-0.5 size-3.5 shrink-0"
                  strokeWidth={1.8}
                />
                <span>
                  {company.name}
                  {parent && ` · ${parent.name}`}
                </span>
              </p>
            )}
            <p
              className={cn(
                "mt-3 text-[0.875rem] leading-relaxed",
                isDark ? "text-white/70" : "text-[#1a1a1a]/70",
              )}
            >
              {t(`team.member.${member.id}.bio`)}
            </p>
          </div>
        </div>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {member.skills.map((s) => (
            <li
              key={s}
              className={cn(
                "rounded-full px-2.5 py-1 text-[0.75rem] font-medium ring-1",
                isDark
                  ? "bg-white/[0.06] text-white/80 ring-white/10"
                  : "bg-black/[0.03] text-[#1a1a1a]/75 ring-black/[0.07]",
              )}
            >
              {t(`team.skill.${s}`)}
            </li>
          ))}
        </ul>
        {/* Kartlar eşit boyda: iletişim satırı dipte, yan yana kartlarda aynı hizada. */}
        <TeamContacts member={member} isDark={isDark} />
        {/* Parlama: imleci izleyen yumuşak ışık (yalnız fareyle). */}
        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glare }}
          />
        )}
      </div>
    </motion.article>
  )
}

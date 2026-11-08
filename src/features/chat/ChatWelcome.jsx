import { Fragment } from "react"
import { motion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { greetingKey } from "@/lib/greeting"

// Boş ekran karşılaması — panodaki kahramanla (AppLauncher.jsx) aynı hareket dili: her
// kelime sırayla belirir, yükselir ve netleşir.
const wordVariants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}
const greetingLineVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
}
const subtitleLineVariants = {
  hidden: {},
  // Subtitle starts after the greeting line is largely revealed so it
  // feels like one continuous wave instead of two parallel runs.
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.95 } },
}

/** Sohbetin boş ekranındaki selamlama ve alt başlık (kelime kelime dalga). */
export function ChatWelcome({ greetHour, firstName }) {
  const { t } = useLocale()
  // Her render'da bölünür ki dil değişince doğru kelimeler çizilsin.
  const greetingWords = t(greetingKey(greetHour)).split(" ")
  const leadWords = t("chat.subtitle.lead").split(" ")
  return (
    <div className="mt-4 space-y-1 text-center sm:mt-6 short:mt-3 shorter:mt-2">
      <motion.h1
        initial="hidden"
        animate="visible"
        variants={greetingLineVariants}
        className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
        aria-label={`${t(greetingKey(greetHour))}, ${firstName}`}
      >
        {greetingWords.map((word, i) => (
          <Fragment key={`g-${i}`}>
            <motion.span variants={wordVariants} className="inline-block">
              {word}
            </motion.span>
            {i < greetingWords.length - 1 ? " " : null}
          </Fragment>
        ))}
        <motion.span variants={wordVariants} className="inline-block">
          ,&nbsp;
        </motion.span>
        <motion.span
          variants={wordVariants}
          className="inline-block bg-gradient-to-r from-brand-text-from via-brand-text-via to-brand-text-to bg-clip-text text-transparent"
        >
          {firstName}
        </motion.span>
      </motion.h1>

      <motion.p
        initial="hidden"
        animate="visible"
        variants={subtitleLineVariants}
        className="text-lg tracking-tight text-foreground/90 sm:text-xl md:text-2xl"
        aria-label={`${t("chat.subtitle.lead")} ${t("chat.subtitle.highlight")}`}
      >
        {leadWords.map((word, i) => (
          <Fragment key={`l-${i}`}>
            <motion.span variants={wordVariants} className="inline-block">
              {word}
            </motion.span>{" "}
          </Fragment>
        ))}
        <motion.span
          variants={wordVariants}
          className="inline-block bg-gradient-to-r from-brand-text-from via-brand-text-via to-brand-text-to bg-clip-text text-transparent"
        >
          {t("chat.subtitle.highlight")}
        </motion.span>
      </motion.p>
    </div>
  )
}

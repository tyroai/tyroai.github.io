import { Fragment } from "react"
import { motion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { EASE, HANDOFF, wordReveal } from "./loginMotion"

const words = (text) => text.split(/\s+/).filter(Boolean)

/**
 * "TYRO"nın çevresi: ada yapışık noktalama (", " · "،") adın kelimesinde kalır ama geçişe girmez.
 * `{brand}` sözlükte yer tutucu; adın kendisi çevrilmez.
 */
function firstLine(template) {
  const [before = "", after = ""] = template.split("\u0000")
  const pre = before.match(/\S*$/)[0]
  const post = after.match(/^\S*/)[0]
  return [
    ...words(before.slice(0, before.length - pre.length)),
    { pre, post },
    ...words(after.slice(post.length)),
  ]
}

/**
 * İki satırlık başlık — kelime kelime akar (`wordReveal`): Atlas'ın yazısı gibi aşağıdan ve
 * bulanıktan süzülür, "çat" diye gelmez. Bağlan'da bütün başlık birlikte söner.
 */
export function LoginTitle({ reduce, leaving, at }) {
  const { t, locale } = useLocale()
  const lines = [firstLine(t("meet.title1", { brand: "\u0000" })), words(t("meet.title2"))]
  let index = 0
  return (
    <motion.h1
      className="login-title"
      dir={locale === "ar" ? "rtl" : undefined}
      animate={{ opacity: leaving ? 0 : 1, y: leaving && !reduce ? -8 : 0 }}
      transition={{ duration: HANDOFF.chrome, ease: EASE }}
    >
      {lines.map((line, li) => (
        <span key={li} className="login-line">
          {line.map((word, wi) => (
            <Fragment key={wi}>
              {wi > 0 && " "}
              <motion.span className="login-word" {...wordReveal(reduce, at, index++)}>
                {typeof word === "string" ? (
                  word
                ) : (
                  <>
                    {word.pre}
                    <span className="login-name">TYRO</span>
                    {word.post}
                  </>
                )}
              </motion.span>
            </Fragment>
          ))}
        </span>
      ))}
    </motion.h1>
  )
}

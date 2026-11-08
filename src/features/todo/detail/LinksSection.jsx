import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Link01Icon from "@hugeicons/core-free-icons/Link01Icon"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"

/**
 * Bağlı içerik (işaretli e-posta, Teams iletisi…): panel açılınca okunur (`$expand` bu kiracıda
 * denenmedi, gerekçe `lib/todoBoard.js`). Yoksa ya da okunamazsa bölüm hiç çizilmez.
 */
export function LinksSection({ board, task }) {
  const { t } = useLocale()
  const [links, setLinks] = useState([])
  useEffect(() => {
    let cancelled = false
    board.loadLinks(task).then((res) => {
      if (!cancelled && res.status === STATUS.ready) setLinks(res.links)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id])
  if (!links.length) return null
  return (
    <section className="td-section">
      <h3 className="rw-section">{t("todo.detail.links")}</h3>
      <ul className="td-links">
        {links.map((l) => (
          <li key={l.id ?? l.url}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="td-link">
              <HugeiconsIcon icon={Link01Icon} aria-hidden="true" strokeWidth={1.8} />
              <span className="td-link-text">{l.title || l.app || l.url}</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden="true" strokeWidth={2} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

import { useLocale } from "@/hooks/useLocale"
import { countText, number } from "../../../kinds"
import { MAX_ROWS } from "../../useExpenseRows"
import { UndoStrip } from "../table/UndoStrip"

/**
 * Yapıştırmanın metinleri `[ana, not]`: "5 kalem yapıştırıldı" ve ardında sınıra takılan ("2 satır
 * eklenmedi: en çok 20 kalem") ile okunamayan ("1 satır okunamadı") satırlar. Hiç kalem
 * eklenmediyse ana metin uyarının kendisi.
 */
function pasteTexts(t, locale, last) {
  const parts = []
  if (last.limit)
    parts.push(
      countText(t, locale, "selfService.expense.paste.limit", last.limit, {
        max: number(MAX_ROWS, locale),
      }),
    )
  if (last.unreadable)
    parts.push(countText(t, locale, "selfService.expense.paste.unreadable", last.unreadable))
  if (!last.added) return [parts[0], parts.slice(1).join(" · ") || null]
  return [
    countText(t, locale, "selfService.expense.paste.added", last.added),
    parts.join(" · ") || null,
  ]
}

/**
 * Excel'den yapıştırmanın sonucu — silinen kalemin "Geri al" şeridiyle aynı görünüş (ızgaranın
 * alt şeridinde; ilk ekranda ve kartlarda kalemlerin altında). Duyuru `PasteAnnounce`ta.
 */
export function PasteStrip({ paste, className }) {
  const { t, locale } = useLocale()
  const last = paste.last
  const [text, note] = last ? pasteTexts(t, locale, last) : [null, null]
  return (
    <UndoStrip
      undo={paste}
      onUndo={last?.added ? paste.undo : null}
      text={text}
      note={note}
      announce={false}
      className={className}
    />
  )
}

/**
 * Yapıştırmanın ekran okuyucu duyurusu: gövdede hep çizili canlı bölge. Şerit ilk ekrandan
 * yapıştırmada ızgarayla birlikte doğar; doğarken dolu gelen bölge okunmayabilir.
 */
export function PasteAnnounce({ paste }) {
  const { t, locale } = useLocale()
  const last = paste.last
  const text = last ? pasteTexts(t, locale, last).filter(Boolean).join(" · ") : ""
  return (
    <p role="status" className="sr-only">
      {text}
    </p>
  )
}

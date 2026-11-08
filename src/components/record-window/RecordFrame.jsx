import { cn } from "@/lib/utils"
import "./recordWindow.css"

/**
 * Kayıt penceresinin çatısı: açık gri çerçeve, üstte şerit (`bar`: `RecordBar`), altında kayan
 * beyaz kâğıt. Pencere kabı (Dialog, yan panel) çağıranda; bu yalnız içi.
 */
export function RecordFrame({ bar, children, className }) {
  return (
    <div className={cn("rw", className)}>
      {bar}
      <div className="rw-scroll">
        <RecordPaper>{children}</RecordPaper>
      </div>
    </div>
  )
}

/**
 * Beyaz kâğıt tek başına — çerçevesiz yere (açılır kart, yan panel) gömülünce. Bölümler arası
 * boşluk kâğıdın `gap`'i; içindekiler kendi kenar boşluğunu yazmaz.
 */
export function RecordPaper({ children, className, as: Tag = "article", ...rest }) {
  return (
    <Tag className={cn("rw-sheet", className)} {...rest}>
      {children}
    </Tag>
  )
}

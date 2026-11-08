import { useLocale } from "@/hooks/useLocale"

const PREVIEW = 5

/** Silinecek görevlerin adları — onay penceresinin kutusu: ilk beşi ve kalanın sayısı. */
export function TaskTitles({ tasks }) {
  const { t } = useLocale()
  const n = tasks.length
  return (
    // `w-0 min-w-full`: uzun ad kutuyu (ızgara öğesi) genişletmesin, kırpılsın.
    <ul className="w-0 min-w-full space-y-0.5">
      {tasks.slice(0, PREVIEW).map((task) => (
        <li key={task.id} className="truncate">
          {task.title || t("todo.untitled")}
        </li>
      ))}
      {n > PREVIEW && (
        <li className="text-muted-foreground">{t("todo.titles.more", { n: n - PREVIEW })}</li>
      )}
    </ul>
  )
}

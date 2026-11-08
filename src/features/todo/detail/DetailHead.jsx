import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import { RecordHeader, RecordTag } from "@/components/record-window/RecordHeader"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { TaskCheck } from "../TaskCheck"
import { AutoText } from "./AutoText"

const OPTS_FULL = { day: "numeric", month: "long", year: "numeric" }

/**
 * Başlık: solda tamamla kutusu, yanında düzenlenebilir görev adı (Enter ya da odak çıkınca
 * kaydedilir), altında etiketler — önemliyse "Önemli", oluşturulma günü (zeminsiz). Liste şeritte,
 * tarih ve tamamlanma kartta: burada tekrar etmez.
 */
export function DetailHead({ task, title, onTitle, onCommitTitle, locked, onToggle }) {
  const { t, locale } = useLocale()
  const created = task.createdAt ? new Date(task.createdAt) : null
  const tags = [
    task.importance === "high" && (
      <RecordTag key="star" icon={StarIcon} tone="brand">
        {t("todo.view.important")}
      </RecordTag>
    ),
    created && !Number.isNaN(created.getTime()) && (
      <RecordTag key="created" icon={CalendarAdd01Icon} plain>
        {t("todo.detail.created", { date: getDateTimeFormat(locale, OPTS_FULL).format(created) })}
      </RecordTag>
    ),
  ].filter(Boolean)
  return (
    <RecordHeader
      lead={
        <span className="td-lead">
          <TaskCheck
            size="lg"
            done={task.done}
            pending={locked}
            onToggle={onToggle}
            label={task.done ? t("todo.check.undo") : t("todo.check.done")}
          />
        </span>
      }
      titleAs="div"
      title={
        <AutoText
          value={title}
          onChange={onTitle}
          onCommit={onCommitTitle}
          singleLine
          disabled={locked}
          label={t("todo.detail.titleLabel")}
          placeholder={t("todo.untitled")}
          className={task.done ? "td-title td-done" : "td-title"}
        />
      }
      tags={tags.length ? tags : null}
    />
  )
}

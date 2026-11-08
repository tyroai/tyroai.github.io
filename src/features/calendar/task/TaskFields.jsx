import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon"
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import { FieldTile } from "@/features/selfservice/request/field/FieldTile"
import { fieldState } from "@/features/selfservice/request/field/fieldState"
import { listIcon } from "@/features/todo/listIcon"
import { useLocale } from "@/hooks/useLocale"
import { DueField } from "./DueField"
import { TaskSteps } from "./TaskSteps"

/**
 * Liste seçimi: karo bir seçim kutusu (`select`) gibi davranır. Gerçek `<select>` karonun
 * tamamını örter (görünmez): her yere basış yerel listeyi açar, klavye ve telefon seçicisi hazır.
 */
function ListField({ idBase, lists, value, onChange }) {
  const { t } = useLocale()
  const current = lists.find((l) => l.id === value)
  return (
    <FieldTile
      as="div"
      icon={listIcon(current)}
      label={t("todo.add.list")}
      labelId={`${idBase}-list-l`}
      value={current?.name}
      placeholder="…"
      trailing={
        <>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="cal-ic cal-task-chev"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <select
            className="cal-task-pick"
            aria-labelledby={`${idBase}-list-l`}
            value={value ?? ""}
            disabled={lists.length === 0}
            onChange={(e) => onChange(e.target.value)}
          >
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </>
      }
    />
  )
}

/**
 * Yeni görev formunun alanları (Self Servis'in alan karoları): başlık · liste ve son tarih ·
 * adımlar · not · önemli. Hepsi isteğe bağlı, yalnız başlık zorunlu. Alt şerit (`TaskFoot`) ve
 * başlık pencerede. `form`: `useTaskForm`.
 */
export function TaskFields({ form }) {
  const { t } = useLocale()
  const { v, set, errors, attempted, idBase, lists, listId, saved } = form
  const titleError = attempted && Boolean(errors.title)
  return (
    // Görev yazıldıktan sonra (adımlar yeniden denenirken) alanlar kilitli: yazılan görevle ayrışmasın.
    <fieldset className="cal-meet-fields cal-task-fields" disabled={saved}>
      <div>
        <FieldTile
          as="label"
          icon={Edit02Icon}
          label={t("todo.detail.titleLabel")}
          state={fieldState({ filled: Boolean(v.title.trim()), required: true, error: titleError })}
        >
          <input
            id={`${idBase}-title`}
            className="cal-meet-input"
            dir="auto"
            value={v.title}
            maxLength={255}
            autoComplete="off"
            placeholder={t("calendar.page.new.taskPlaceholder")}
            aria-required="true"
            aria-invalid={titleError || undefined}
            aria-describedby={titleError ? `${idBase}-title-err` : undefined}
            onChange={(e) => set({ title: e.target.value })}
          />
        </FieldTile>
        {titleError && (
          <p id={`${idBase}-title-err`} className="cal-meet-err" role="alert">
            {t("calendar.task.errTitle")}
          </p>
        )}
      </div>

      <div className="cal-task-row">
        <ListField
          idBase={idBase}
          lists={lists}
          value={listId}
          onChange={(id) => set({ listId: id })}
        />
        <DueField value={v.dueKey} onChange={(dueKey) => set({ dueKey })} />
      </div>

      <TaskSteps idBase={idBase} steps={v.steps} onChange={(steps) => set({ steps })} />

      <FieldTile
        as="label"
        icon={Note01Icon}
        label={t("todo.detail.note")}
        className="cal-meet-note"
      >
        <textarea
          className="cal-meet-input"
          dir="auto"
          rows={2}
          value={v.note}
          maxLength={4000}
          placeholder={t("todo.detail.notePlaceholder")}
          onChange={(e) => set({ note: e.target.value })}
        />
      </FieldTile>

      <FieldTile
        icon={StarIcon}
        label={t("todo.kpi.important")}
        labelId={`${idBase}-imp-l`}
        value={t(v.important ? "calendar.task.yes" : "calendar.task.no")}
        role="switch"
        aria-checked={v.important}
        aria-labelledby={`${idBase}-imp-l`}
        onClick={() => set({ important: !v.important })}
        trailing={
          <span className="cal-switch" data-on={v.important || undefined} aria-hidden="true" />
        }
      />
    </fieldset>
  )
}

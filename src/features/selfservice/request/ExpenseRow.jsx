import { LineCard } from "./expense/line/LineCard"
import { LineRow } from "./expense/line/LineRow"

/**
 * Masraf kalemi (telefon ve dar pencere). Açıkken kart: gruplu liste alanları ve "Ayrıntı";
 * kapalıyken tek satır özet (kategorinin simgesi, kategori, tarih, tutar) — basınca açılır. Fiş
 * kalemde değil, masrafın başlığında. Bir anda tek kalem açık (`form.expense.active`). Gönderme
 * denemesinden sonra eksik kalemin numarası kırmızı ve "Eksik" etiketi taşır. `first`/`last`:
 * kapalı kümenin ilki ve sonu.
 */
export function ExpenseRow({
  form,
  row,
  n,
  idBase,
  open,
  errors,
  canAdd,
  first,
  last,
  onOpen,
  onCollapse,
  onCopy,
  onRemove,
}) {
  if (!open) {
    return (
      <LineRow
        row={row}
        n={n}
        invalid={Boolean(errors && Object.keys(errors).length)}
        first={first}
        last={last}
        onOpen={onOpen}
      />
    )
  }
  return (
    <LineCard
      form={form}
      row={row}
      n={n}
      base={`${idBase}-${row.id}`}
      errors={errors}
      canCopy={canAdd}
      onCopy={onCopy}
      onRemove={onRemove}
      onCollapse={onCollapse}
    />
  )
}

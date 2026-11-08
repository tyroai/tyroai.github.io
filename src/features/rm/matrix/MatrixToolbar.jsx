import { HugeiconsIcon } from "@hugeicons/react"
import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import ArrowShrink01Icon from "@hugeicons/core-free-icons/ArrowShrink01Icon"
import Download01Icon from "@hugeicons/core-free-icons/Download01Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ZOOMS } from "@/features/rm/lib/matrix"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { ExpandAll, SearchField } from "../common/TreeTools"

const ALL = "__all"
const ICON = "pointer-coarse:size-11"

/**
 * Matrisin araç satırı: görünüm, ölçek, aralıkta gezinme; arama ve (ekip ve kişi bazlıda) ekip; sağda
 * tümünü aç/daralt, Excel ve tam ekran. `lead`: tam ekranda satırın başındaki başlık. Kısa ekranda
 * (yatay telefon) tam ekranın denetimleri tek satırda kayar; tam ekran düğmesi şeridin ucuna yapışır —
 * telefonda Esc yok, çıkış o düğme. `on`: { mode, zoom, step, today, search, team, toggleAll, excel, full }.
 */
export function MatrixToolbar({ lead, mode, zoom, q, team, teams, fold, busy, full, on }) {
  const { rt } = useRmText()
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        full &&
          "shortest:flex-nowrap shortest:overflow-x-auto shortest:[scrollbar-width:none] shortest:[&>*]:shrink-0",
      )}
    >
      {lead}
      <SegmentedControl
        label={rt("rm.matrix.mode")}
        value={mode}
        onChange={on.mode}
        options={[
          { value: "project", label: rt("rm.matrix.byProject") },
          { value: "team", label: rt("rm.matrix.byTeam") },
          { value: "person", label: rt("rm.matrix.byPerson") },
        ]}
      />
      <SegmentedControl
        label={rt("rm.matrix.zoom")}
        value={zoom}
        onChange={on.zoom}
        options={ZOOMS.map((z) => ({ value: z, label: rt(`rm.matrix.zoom.${z}`) }))}
      />
      <span className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => on.step(-1)}
          aria-label={rt("rm.matrix.prev")}
          className={ICON}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 rtl:rotate-180" />
        </Button>
        <Button variant="outline" size="sm" onClick={on.today} className="pointer-coarse:h-11">
          {rt("rm.matrix.today")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => on.step(1)}
          aria-label={rt("rm.matrix.next")}
          className={ICON}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 rtl:rotate-180" />
        </Button>
      </span>
      <SearchField
        value={q ?? ""}
        onChange={on.search}
        label={rt("rm.matrix.search")}
        className="ms-auto"
      />
      {mode !== "project" && (
        <Select value={team || ALL} onValueChange={(v) => on.team(v === ALL ? null : v)}>
          <SelectTrigger
            className="h-9 w-auto min-w-[9rem] rounded-full pointer-coarse:h-11"
            aria-label={rt("rm.capacity.team")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{rt("rm.capacity.teamAll")}</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <span className="flex items-center gap-1">
        {fold && <ExpandAll allClosed={fold.allClosed} onClick={on.toggleAll} />}
        <Button
          variant="outline"
          size="sm"
          onClick={on.excel}
          disabled={busy}
          title={rt("rm.matrix.excelHint")}
          className="h-9 gap-1.5 px-3 text-[0.8125rem] pointer-coarse:h-11"
        >
          <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={1.8} />
          {rt("rm.x.export")}
        </Button>
      </span>
      {/* Şeridin doğrudan çocuğu: yapışkan öğe ebeveyninin dışına çıkamaz. */}
      <span
        className={cn(
          "-ms-1 flex",
          full &&
            "shortest:sticky shortest:end-0 shortest:ms-0 shortest:bg-background shortest:ps-1",
        )}
      >
        <Button
          variant={full ? "secondary" : "ghost"}
          size="icon"
          onClick={on.full}
          aria-label={rt(full ? "rm.matrix.fullExit" : "rm.matrix.full")}
          title={rt(full ? "rm.matrix.fullExit" : "rm.matrix.full")}
          className={ICON}
        >
          <HugeiconsIcon
            icon={full ? ArrowShrink01Icon : ArrowExpand01Icon}
            className="size-4"
            strokeWidth={1.8}
          />
        </Button>
      </span>
    </div>
  )
}
